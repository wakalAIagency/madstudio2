import type { DefaultSession, NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

interface SupabaseUser {
  id: string;
  email: string;
  password_hash: string;
  role: "admin" | "viewer";
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const supabase = getSupabaseServiceRoleClient();

        const { data, error } = await supabase
          .from("users")
          .select("id, email, password_hash, role")
          .eq("email", credentials.email.toLowerCase())
          .single();

        if (error || !data) {
          return null;
        }

        const isValid = await compare(credentials.password, data.password_hash);
        if (!isValid) {
          return null;
        }

        if (data.role !== "admin") {
          return null;
        }

        return {
          id: data.id,
          email: data.email,
          role: data.role,
        } satisfies Omit<SupabaseUser, "password_hash">;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as { role?: string }).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

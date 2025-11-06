import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/options";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return session;
}


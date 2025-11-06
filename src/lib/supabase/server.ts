import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getServerEnv } from "../env";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const cookieOptions: CookieOptions = {
  domain: undefined,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
  sameSite: "lax",
  secure: true,
};

export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const env = getServerEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          if ("set" in cookieStore && typeof cookieStore.set === "function") {
            cookieStore.set({
              name,
              value,
              ...cookieOptions,
              ...options,
            });
          }
        },
        remove(name: string, options: CookieOptions) {
          if ("set" in cookieStore && typeof cookieStore.set === "function") {
            cookieStore.set({
              name,
              value: "",
              ...cookieOptions,
              ...options,
              maxAge: 0,
            });
          }
        },
      },
    },
  );
}

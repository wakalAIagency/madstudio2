import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { CookieOptions } from "@supabase/ssr";

import { getServerEnv } from "../env";

const cookieOptions: CookieOptions = {
  domain: undefined,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
  sameSite: "lax",
  secure: true,
};

export function createSupabaseServerClient() {
  const env = getServerEnv();
  const cookieStore = cookies();
  const headerStore = headers();

  return createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            ...cookieOptions,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value: "",
            ...cookieOptions,
            ...options,
            maxAge: 0,
          });
        },
      },
      headers: {
        get(key: string) {
          return headerStore.get(key) ?? undefined;
        },
      },
    },
  );
}


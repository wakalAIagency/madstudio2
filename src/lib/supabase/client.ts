import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "../env";

let clientSingleton: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!clientSingleton) {
    const env = getClientEnv();
    clientSingleton = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  return clientSingleton;
}


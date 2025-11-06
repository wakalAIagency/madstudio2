import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "../env";

let serviceClientSingleton:
  | ReturnType<typeof createClient>
  | null = null;

export function getSupabaseServiceRoleClient() {
  if (!serviceClientSingleton) {
    const env = getServerEnv();
    serviceClientSingleton = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return serviceClientSingleton;
}


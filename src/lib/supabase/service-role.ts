import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "../env";
import type { Database } from "@/types/supabase";

type TypedSupabaseClient = SupabaseClient<Database>;

let serviceClientSingleton: TypedSupabaseClient | null = null;

export function getSupabaseServiceRoleClient(): TypedSupabaseClient {
  if (!serviceClientSingleton) {
    const env = getServerEnv();
    serviceClientSingleton = createClient<Database>(
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

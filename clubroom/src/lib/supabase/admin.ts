import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Service-role client. Bypasses RLS. Only for server code that has already
 * done its own authorisation (public registration, webhooks, exports).
 * Never import this from a Client Component.
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv.supabaseUrl(), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server-only contexts (the daily cron job).
// Bypasses Row Level Security — never import this into anything client-facing.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

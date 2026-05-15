import { createClient } from "@supabase/supabase-js";

// Server-only Supabase admin client — uses service role key (full DB access)
// Works from Vercel via HTTPS, no TCP connection needed
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

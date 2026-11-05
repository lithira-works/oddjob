import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Uses the secret key, which bypasses every access rule. Only for private ID files and writes
 * that no visitor may make. Never pass its results to the browser.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Secret key is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Supabase admin client (service role) for Server Actions only
import { createClient } from "@supabase/supabase-js";

// Singleton — the service-role client is stateless (no user session) so it is
// safe to share a single instance across all server-side calls in the same
// worker process, avoiding repeated construction overhead.
let _adminClient: ReturnType<typeof createClient> | undefined;

export function createAdminClient() {
  if (_adminClient) return _adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars");
  }
  _adminClient = createClient(url, key, { auth: { persistSession: false } });
  return _adminClient;
}

// Supabase client for Client Components
"use client";

import { createBrowserClient } from "@supabase/ssr";

// Singleton — reused across the component tree to avoid redundant connections.
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or ANON_KEY env vars");
  }
  _client = createBrowserClient(url, key);
  return _client;
}

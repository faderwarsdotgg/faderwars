import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gbpkbnlrgkygitiogicm.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function fixedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = input.toString().replace("supabase.com", "supabase.co");
  return fetch(url, init);
}

export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { fetch: fixedFetch },
  });
}

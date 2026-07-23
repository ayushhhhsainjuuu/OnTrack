import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL. Check your .env.local file and restart npm run dev."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Check your .env.local file and restart npm run dev."
  );
}

export const REMEMBER_ME_KEY = "ontrack-remember-me";

// Browser-only client (for "use client" components). Persists the session in
// cookies -- not just localStorage -- so Route Handlers/Server Components can
// read the same session via lib/supabase/server.js and RLS evaluates as the
// real logged-in user instead of the anonymous role.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

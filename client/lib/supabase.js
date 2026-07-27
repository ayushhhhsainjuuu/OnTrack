import { createClient } from "@supabase/supabase-js";

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

/*
  Checked:
  Supabase session is stored in localStorage and remains after
  the browser is closed.

  Unchecked:
  Supabase session is stored in sessionStorage and normally ends
  when the browser session is closed.
*/
const authStorage = {
  getItem(key) {
    if (typeof window === "undefined") {
      return null;
    }

    const rememberMe =
      window.localStorage.getItem(REMEMBER_ME_KEY) !== "false";

    if (rememberMe) {
      return window.localStorage.getItem(key);
    }

    return window.sessionStorage.getItem(key);
  },

  setItem(key, value) {
    if (typeof window === "undefined") {
      return;
    }

    const rememberMe =
      window.localStorage.getItem(REMEMBER_ME_KEY) !== "false";

    if (rememberMe) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },

  removeItem(key) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage,
    },
  }
);
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/types/database";

let browserClient: SupabaseClient<Database> | null | undefined;

function readSupabaseConfig() {
  return {
    url: import.meta.env["VITE_SUPABASE_URL"],
    key:
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"],
  };
}

export function isSupabaseConfigured() {
  const { url, key } = readSupabaseConfig();
  return Boolean(url && key);
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (browserClient !== undefined) {
    return browserClient;
  }

  const { url, key } = readSupabaseConfig();

  if (!url || !key) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

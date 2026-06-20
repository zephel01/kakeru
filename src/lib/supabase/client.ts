import { createClient } from "@supabase/supabase-js";

/**
 * ブラウザ向け Supabase クライアント（公開 anon key を使用）。
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars are not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  return createClient(url, anonKey);
}

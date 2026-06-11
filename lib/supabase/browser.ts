"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isBrowserSupabaseConfigured() {
  return (
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 20 &&
    !supabaseUrl.includes("your-project-ref")
  );
}

export function createBrowserSupabaseClient() {
  if (!isBrowserSupabaseConfigured()) {
    throw new Error("Supabase authentication is not configured.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

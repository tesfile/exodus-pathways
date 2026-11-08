import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

function safeDestination(value: string | null) {
  if (value === "/reset-password") {
    return value;
  }
  if (value === "/portal/documents" || value === "/portal/messages") {
    return value;
  }
  return "/portal/documents";
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=supabase_not_configured", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  return NextResponse.redirect(new URL(safeDestination(request.nextUrl.searchParams.get("next")), request.url));
}

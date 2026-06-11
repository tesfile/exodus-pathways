import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { PortalRole } from "@/lib/types";

const protectedRoutes = ["/dashboard", "/admin", "/employee", "/portal", "/client"];

function configured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return url.startsWith("https://") && anon.length > 20 && !url.includes("your-project-ref");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!configured()) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    loginUrl.searchParams.set("error", "supabase_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({
    request
  });
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof response.cookies.set>[2];
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user.email_confirmed_at) {
    const verifyUrl = request.nextUrl.clone();
    verifyUrl.pathname = "/verify-email";
    verifyUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(verifyUrl);
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const role = userRecord?.role as PortalRole | undefined;

  if (!role) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "user_record_required");
    return NextResponse.redirect(loginUrl);
  }

  const requiredRole = requiredRoleForPath(pathname);

  if (requiredRole && role !== requiredRole) {
    const roleUrl = request.nextUrl.clone();
    roleUrl.pathname = dashboardForRole(role);
    roleUrl.search = "";
    return NextResponse.redirect(roleUrl);
  }

  return response;
}

function requiredRoleForPath(pathname: string): PortalRole | null {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  if (pathname.startsWith("/employee")) {
    return "employee";
  }

  if (pathname.startsWith("/portal") || pathname.startsWith("/client") || pathname.startsWith("/dashboard")) {
    return "client";
  }

  return null;
}

function dashboardForRole(role: PortalRole) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "employee") {
    return "/employee";
  }

  return "/dashboard";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};

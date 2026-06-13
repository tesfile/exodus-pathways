import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { PortalRole, PortalUser } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured() {
  return (
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 20 &&
    !supabaseUrl.includes("your-project-ref")
  );
}

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase authentication is not configured.");
  }

  const cookieStore = await cookies();
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always set cookies. Middleware handles session refresh.
          }
        }
      }
    }
  );
}

export async function getCurrentUserRecord(): Promise<PortalUser> {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=supabase_not_configured");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  const { data: userRecord, error } = await supabase
    .from("users")
    .select("id,email,full_name,display_name,client_type,phone,role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !userRecord) {
    redirect("/login?error=user_record_required");
  }

  const record = userRecord as PortalUser;
  return {
    ...record,
    display_name: record.display_name || record.full_name,
    client_type: record.client_type ?? "individual"
  };
}

export function dashboardForRole(role: PortalRole) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "employee") {
    return "/employee";
  }

  return "/dashboard";
}

export async function requireRole(allowedRoles: PortalRole[]) {
  const user = await getCurrentUserRecord();

  if (!allowedRoles.includes(user.role)) {
    redirect(dashboardForRole(user.role));
  }

  return user;
}

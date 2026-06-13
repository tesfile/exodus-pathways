"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/provider";
import type { PortalRole } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useT();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setLoading(true);
    setStatus("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setStatus("Invalid login credentials");
        return;
      }

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();
        setStatus("Invalid login credentials");
        return;
      }

      const { data: userRecord, error: userRecordError } = await supabase
        .from("users")
        .select("id,email,full_name,role")
        .eq("id", user.id)
        .maybeSingle();

      if (userRecordError || !userRecord || !isPortalRole(userRecord.role)) {
        await supabase.auth.signOut();
        setStatus("Account record not found. Please contact Exodus Pathways.");
        return;
      }

      router.push(routeForRole(userRecord.role, searchParams.get("next")));
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invalid login credentials");
      return;
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
      <div>
        <label htmlFor="email" className="label">
          {t("auth.email")}
        </label>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-exodus-slate" aria-hidden="true" />
          <input id="email" name="email" type="email" required className="field pl-10" placeholder="client@example.ca" />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">
          {t("auth.password")}
        </label>
        <div className="relative mt-2">
          <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-exodus-slate" aria-hidden="true" />
          <input id="password" name="password" type="password" required className="field pl-10" placeholder="Your secure password" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="focus-ring min-h-14 rounded-md bg-exodus-navy px-4 py-3 text-base font-black text-white transition hover:bg-exodus-blue disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-11 sm:py-2.5 sm:text-sm"
      >
        {loading ? t("common.loading") : t("auth.login.button")}
      </button>

      {status ? <p className="text-sm font-semibold text-exodus-navy">{status}</p> : null}

      <p className="rounded-md bg-exodus-light p-3 text-xs font-semibold leading-5 text-exodus-navy">
        {t("common.noBankLogin")}
      </p>

      <div className="flex flex-col gap-2 text-sm font-black text-exodus-blue sm:flex-row sm:justify-between">
        <Link href="/signup">{t("auth.login.needAccount")}</Link>
        <Link href="/forgot-password">{t("auth.login.forgot")}</Link>
      </div>
    </form>
  );
}

function isPortalRole(role: unknown): role is PortalRole {
  return role === "admin" || role === "employee" || role === "client";
}

function routeForRole(role: PortalRole, requestedPath: string | null) {
  const fallback = role === "admin" ? "/admin" : role === "employee" ? "/employee" : "/dashboard";

  if (!requestedPath || !requestedPath.startsWith("/") || requestedPath.startsWith("//")) {
    return fallback;
  }

  if (role === "admin" && requestedPath.startsWith("/admin")) {
    return requestedPath;
  }

  if (role === "employee" && requestedPath.startsWith("/employee")) {
    return requestedPath;
  }

  if (
    role === "client" &&
    (requestedPath.startsWith("/client") ||
      requestedPath.startsWith("/dashboard") ||
      requestedPath.startsWith("/portal"))
  ) {
    return requestedPath;
  }

  return fallback;
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useT } from "@/lib/i18n/provider";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
}

export function SignUpForm() {
  const { t } = useT();
  const [clientType, setClientType] = useState<"individual" | "business">("individual");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "");
    const legalBusinessName = String(form.get("legalBusinessName") ?? "");
    const contactPerson = String(form.get("contactPerson") ?? "");
    const displayName = clientType === "business" ? legalBusinessName : fullName;

    setLoading(true);
    try {
      const { error } = await createBrowserSupabaseClient().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl()}/verify-email`,
          data: {
            client_type: clientType,
            display_name: displayName,
            full_name: clientType === "business" ? contactPerson : fullName
          }
        }
      });
      setStatus(error?.message ?? t("auth.signup.success"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard titleKey="auth.signup.title" subtitleKey="auth.signup.subtitle">
      <form onSubmit={submit} className="grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="label">Client Type:</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <TypeButton label="Individual" selected={clientType === "individual"} onClick={() => setClientType("individual")} />
            <TypeButton label="Business / Corporation" selected={clientType === "business"} onClick={() => setClientType("business")} />
          </div>
        </fieldset>
        {clientType === "individual" ? (
          <>
            <Field name="fullName" label="Full name" autoComplete="name" />
          </>
        ) : (
          <>
            <Field name="legalBusinessName" label="Legal Business Name" autoComplete="organization" />
            <Field name="contactPerson" label="Contact Person" autoComplete="name" />
          </>
        )}
        <Field name="email" label="Email address" type="email" autoComplete="email" />
        <Field name="password" label="Password" type="password" autoComplete="new-password" />
        <SubmitButton loading={loading}>{t("auth.signup.button")}</SubmitButton>
        {status ? <p className="text-sm font-semibold text-exodus-navy">{status}</p> : null}
        <Link href="/login" className="text-sm font-black text-exodus-blue">
          {t("auth.login.button")}
        </Link>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const { t } = useT();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");

    setLoading(true);
    try {
      const { error } = await createBrowserSupabaseClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl()}/reset-password`
      });
      setStatus(error?.message ?? t("auth.forgot.button"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard titleKey="auth.forgot.title" subtitleKey="auth.forgot.subtitle">
      <form onSubmit={submit} className="grid gap-4">
        <Field name="email" label={t("auth.email")} type="email" autoComplete="email" />
        <SubmitButton loading={loading}>{t("auth.forgot.button")}</SubmitButton>
        {status ? <p className="text-sm font-semibold text-exodus-navy">{status}</p> : null}
      </form>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const { t } = useT();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");

    setLoading(true);
    try {
      const { error } = await createBrowserSupabaseClient().auth.updateUser({ password });
      if (error) {
        setStatus(error.message);
        return;
      }
      router.push("/login");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard titleKey="auth.reset.title" subtitleKey="auth.reset.subtitle">
      <form onSubmit={submit} className="grid gap-4">
        <Field name="password" label={t("auth.newPassword")} type="password" autoComplete="new-password" />
        <SubmitButton loading={loading}>{t("auth.reset.button")}</SubmitButton>
        {status ? <p className="text-sm font-semibold text-exodus-navy">{status}</p> : null}
      </form>
    </AuthCard>
  );
}

export function VerifyEmailPanel() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function resend() {
    if (!email) {
      setStatus(t("auth.email"));
      return;
    }
    try {
      const { error } = await createBrowserSupabaseClient().auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${siteUrl()}/verify-email` }
      });
      setStatus(error?.message ?? t("auth.signup.success"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Verification email failed.");
    }
  }

  return (
    <AuthCard titleKey="auth.verify.title" subtitleKey="auth.verify.subtitle">
      <div className="grid gap-4">
        <Field name="email" label={t("auth.email")} type="email" value={email} onChange={setEmail} />
        <button
          type="button"
          onClick={resend}
          className="focus-ring min-h-11 rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-bold text-white transition hover:bg-exodus-blue"
        >
          {t("auth.verify.resend")}
        </button>
        {status ? <p className="text-sm font-semibold text-exodus-navy">{status}</p> : null}
        <p className="rounded-md bg-exodus-light p-3 text-sm font-semibold text-exodus-navy">
          {t("auth.future2fa")}
        </p>
      </div>
    </AuthCard>
  );
}

function AuthCard({
  titleKey,
  subtitleKey,
  children
}: {
  titleKey: string;
  subtitleKey: string;
  children: React.ReactNode;
}) {
  const { t } = useT();

  return (
    <section className="bg-exodus-light py-8 sm:py-12 lg:py-16">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="eyebrow">{t("common.securePortal")}</p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-exodus-navy sm:text-5xl">
            {t(titleKey)}
          </h1>
          <p className="mt-5 text-base leading-7 text-exodus-slate">{t(subtitleKey)}</p>
          <div className="mt-6 flex gap-3 rounded-md border border-exodus-gold/30 bg-white p-4 text-sm font-semibold leading-6 text-exodus-navy shadow-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-exodus-gold" aria-hidden="true" />
            {t("common.disclaimer")}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-soft sm:p-6">{children}</div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  required = true
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <div className="relative mt-2">
        <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-exodus-slate" aria-hidden="true" />
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          autoComplete={autoComplete}
          className="field pl-10"
        />
      </div>
    </div>
  );
}

function TypeButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring min-h-14 rounded-md border px-3 text-base font-black sm:text-sm ${
        selected ? "border-exodus-gold bg-exodus-navy text-white" : "border-slate-200 bg-exodus-light text-exodus-navy"
      }`}
    >
      {label}
    </button>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="focus-ring min-h-14 rounded-md bg-exodus-navy px-4 py-3 text-base font-black text-white transition hover:bg-exodus-blue disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-11 sm:py-2.5 sm:text-sm"
    >
      {children}
    </button>
  );
}

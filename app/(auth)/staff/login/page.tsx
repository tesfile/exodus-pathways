import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/public/login-form";

export const metadata: Metadata = {
  title: "Staff Login"
};

export default function StaffLoginPage() {
  return (
    <section className="kal-auth-backdrop py-12 sm:py-16">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="rounded-lg bg-[#fff9e9]/95 p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-4"><Image src="/images/kal-logo.png" alt="KAL Service Alliance logo" width={64} height={64} className="h-16 w-16 object-contain" /><div><p className="text-xs font-bold uppercase tracking-wider text-exodus-gold">Authorized staff</p><p className="text-sm font-bold text-exodus-navy">{`A Division of Kal Service Alliance Inc.`}</p></div></div>
          <h1 className="mt-5 text-3xl font-black leading-tight text-exodus-navy sm:text-4xl">Staff and administrator sign in.</h1>
          <p className="mt-4 text-base leading-7 text-exodus-slate">
            Staff access is granted only to accounts with an authorized role in the secure database.
          </p>
        </div>
        <Suspense fallback={<div className="rounded-md bg-white p-6 shadow-soft">Loading staff login...</div>}>
          <LoginForm staffOnly />
        </Suspense>
      </div>
    </section>
  );
}

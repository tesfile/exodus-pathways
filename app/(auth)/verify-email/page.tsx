import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/public/auth-forms";

export const metadata: Metadata = {
  title: "Verify Email"
};

export default function VerifyEmailPage() {
  return <VerifyEmailPanel />;
}

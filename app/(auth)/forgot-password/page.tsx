import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/public/auth-forms";

export const metadata: Metadata = {
  title: "Forgot Password"
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

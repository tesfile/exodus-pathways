import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/lib/i18n/provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Exodus Pathways",
    template: "%s | Exodus Pathways"
  },
  description:
    "A secure Canadian client portal for accounting, tax, bookkeeping, payroll, immigration, and business services."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f3d73"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

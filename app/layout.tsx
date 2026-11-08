import type { Metadata, Viewport } from "next";
import { LanguageProvider } from "@/lib/i18n/provider";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "KAL ACCOUNTING & TAX | Accounting & Tax Services",
    template: "%s | KAL ACCOUNTING & TAX"
  },
  description:
    "KAL ACCOUNTING & TAX, a division of Kal Service Alliance Inc. Secure client documents and professional accounting and tax services.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/kal-logo.png",
    apple: "/images/kal-logo.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KAL Accounting & Tax"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#073c7b"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <PwaRegistration />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return <><PublicHeader/><main>{children}</main><PublicFooter/></>;
}

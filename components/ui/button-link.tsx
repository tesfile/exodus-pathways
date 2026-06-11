import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: LucideIcon;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  icon: Icon,
  className
}: ButtonLinkProps) {
  const styles = {
    primary: "bg-exodus-gold text-exodus-ink hover:bg-[#d8aa46]",
    secondary: "bg-white text-exodus-navy ring-1 ring-slate-200 hover:bg-exodus-light",
    ghost: "bg-transparent text-white ring-1 ring-white/30 hover:bg-white/10"
  };

  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold shadow-sm transition",
        styles[variant],
        className
      )}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{children}</span>
    </Link>
  );
}

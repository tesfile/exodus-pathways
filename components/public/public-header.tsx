import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/constants";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="section-shell flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-md">
          <Image src="/images/kal-logo.png" alt="KAL Service Alliance logo" width={52} height={52} className="h-12 w-12 object-contain" priority />
          <span>
            <span className="block text-base font-black text-exodus-navy sm:text-lg">{brand.name}</span>
            <span className="block text-xs font-semibold text-exodus-slate">{brand.tagline}</span>
            <span className="block text-[0.68rem] font-semibold text-exodus-slate">Accounting &amp; Tax Services</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Account navigation">
          <Link href="/login" className="focus-ring rounded-md px-3 py-2 text-sm font-bold text-exodus-navy hover:bg-exodus-light">Client Login</Link>
          <Link href="/signup" className="focus-ring rounded-md bg-exodus-navy px-4 py-2.5 text-sm font-black text-white hover:bg-exodus-blue">Register</Link>
        </nav>
      </div>
    </header>
  );
}

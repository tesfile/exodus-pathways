import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, ShieldCheck } from "lucide-react";
import { brand } from "@/lib/constants";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="section-shell grid gap-8 py-8 sm:grid-cols-2 sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/images/kal-logo.png" alt="KAL Service Alliance logo" width={44} height={44} className="h-11 w-11 object-contain" />
            <div><p className="font-black text-exodus-navy">{brand.name}</p><p className="mt-1 text-xs font-semibold text-exodus-slate">{brand.tagline}</p></div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-exodus-slate">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-exodus-gold" aria-hidden="true" />
            Secure client documents are accessible only to the client and authorized staff roles.
          </p>
        </div>
        <div className="grid gap-3 text-sm font-semibold text-exodus-navy sm:justify-items-end">
          <a href="mailto:info@kalservice.ca" className="focus-ring inline-flex items-center gap-2"><Mail className="h-4 w-4 text-exodus-gold" aria-hidden="true" />info@kalservice.ca</a>
          <a href="tel:+13688869018" className="focus-ring">+1 (368) 886-9018</a>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-exodus-gold" aria-hidden="true" />3016 5 Ave NE, Calgary, AB T2A 6K4</span>
          <div className="flex gap-4 text-xs">
            <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
            <Link href="/staff/login" className="underline underline-offset-4">Staff Login</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 py-3 text-center text-xs text-exodus-slate">
        Copyright {new Date().getFullYear()} KAL ACCOUNTING &amp; TAX
      </div>
    </footer>
  );
}

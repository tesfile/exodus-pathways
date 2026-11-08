import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy"
};

export default function PrivacyPolicyPage() {
  return (
    <article className="section-shell max-w-4xl py-12 sm:py-16">
      <p className="eyebrow">KAL ACCOUNTING &amp; TAX</p>
      <h1 className="mt-3 text-4xl font-black text-exodus-navy">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-6 text-exodus-slate">This policy describes information handled through the KAL Accounting &amp; Tax website and client portal on exoduspathways.ca.</p>
      <div className="mt-8 grid gap-6 text-sm leading-7 text-exodus-slate">
        <section><h2 className="text-lg font-black text-exodus-navy">Information you provide</h2><p className="mt-2">When you register or use the portal, we process account details and documents you choose to upload, including accounting, tax, payroll, invoice, receipt, and bank statement records, as well as messages you send.</p></section>
        <section><h2 className="text-lg font-black text-exodus-navy">How information is used</h2><p className="mt-2">Information is used to provide accounting and tax support, organize client files, respond to messages, and maintain the portal. Documents are stored in private Supabase Storage buckets and access is controlled through authenticated accounts, database roles, and row-level access policies.</p></section>
        <section><h2 className="text-lg font-black text-exodus-navy">Document processing</h2><p className="mt-2">Uploaded records are available to authorized staff for review. Automated extraction is not represented as active unless an extraction provider has been configured and tested for this service.</p></section>
        <section><h2 className="text-lg font-black text-exodus-navy">Retention and requests</h2><p className="mt-2">Records may be retained as needed to provide professional services and meet applicable legal or accounting obligations. Contact KAL Accounting &amp; Tax to ask about your information or account.</p></section>
        <section><h2 className="text-lg font-black text-exodus-navy">Contact</h2><p className="mt-2">Email <a className="font-bold text-exodus-blue underline" href="mailto:info@kalservice.ca">info@kalservice.ca</a> or call <a className="font-bold text-exodus-blue underline" href="tel:+13688869018">+1 (368) 886-9018</a>. Office: 3016 5 Ave NE, Calgary, AB T2A 6K4. Do not send passwords, banking credentials, or payment card details.</p></section>
      </div>
    </article>
  );
}

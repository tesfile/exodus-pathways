import type { Metadata } from "next";
import { ServicePage } from "@/components/public/service-page";
import { services } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Accounting & Tax"
};

export default function AccountingTaxPage() {
  return <ServicePage {...services["accounting-tax"]} />;
}

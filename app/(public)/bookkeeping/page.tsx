import type { Metadata } from "next";
import { ServicePage } from "@/components/public/service-page";
import { services } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Bookkeeping"
};

export default function BookkeepingPage() {
  return <ServicePage {...services.bookkeeping} />;
}

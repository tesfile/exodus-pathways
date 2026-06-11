import type { Metadata } from "next";
import { ServicePage } from "@/components/public/service-page";
import { services } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Business Services"
};

export default function BusinessServicesPage() {
  return <ServicePage {...services["business-services"]} />;
}

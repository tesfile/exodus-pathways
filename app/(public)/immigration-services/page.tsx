import type { Metadata } from "next";
import { ImmigrationProgramIndex } from "@/components/public/immigration-program-index";
import { ServicePage } from "@/components/public/service-page";
import { services } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Immigration Services"
};

export default function ImmigrationServicesPage() {
  return (
    <>
      <ServicePage {...services["immigration-services"]} />
      <ImmigrationProgramIndex />
    </>
  );
}

import { redirect } from "next/navigation";
import { parseYear } from "@/lib/accounting/data";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClientPayrollRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);

  redirect(`/portal/workers-payments?year=${taxYear}`);
}

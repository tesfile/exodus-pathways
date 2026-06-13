import { AccountingHeader, AccountingTable, ClientAccountingFilter } from "@/components/portal/accounting-records";
import { WorkersPaymentsForms } from "@/components/portal/workers-payments-forms";
import { parseYear } from "@/lib/accounting/data";
import {
  getClientWorkersPaymentsData,
  workerPaymentRows,
  workerSummaryRows
} from "@/lib/workers-payments";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkersPaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const taxYear = parseYear(params?.year);
  const data = await getClientWorkersPaymentsData(taxYear);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="Workers & Payments"
        description="Tell us who you paid. Exodus Pathways will review what type of payment it is."
        eyebrow="Client portal"
        showExports={false}
      >
        <ClientAccountingFilter selectedYear={taxYear} action="/portal/workers-payments" />
      </AccountingHeader>
      <WorkersPaymentsForms
        taxYear={taxYear}
        companies={data.companies}
        workers={data.workers.map((worker) => ({
          id: worker.id,
          name: worker.worker_name,
          type: worker.worker_type,
          companyId: worker.company_id
        }))}
      />
      <AccountingTable
        title={`${taxYear} Total Paid By Person`}
        columns={[
          { key: "worker", label: "Who You Paid" },
          { key: "payments", label: "Payments" },
          { key: "totalPaid", label: "Total Paid" }
        ]}
        rows={workerSummaryRows(data)}
      />
      <AccountingTable
        title="Payments You Added"
        columns={[
          { key: "date", label: "Date Paid" },
          { key: "worker", label: "Who You Paid" },
          { key: "amount", label: "Amount" },
          { key: "method", label: "Payment Method" },
          { key: "invoiceProvided", label: "Invoice?" },
          { key: "clientType", label: "Client Selected Type" },
          { key: "invoice", label: "Invoice" },
          { key: "status", label: "Status" }
        ]}
        rows={workerPaymentRows(data)}
      />
    </div>
  );
}

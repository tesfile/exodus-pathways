import { AccountingHeader, AccountingTable } from "@/components/portal/accounting-records";
import { T4UploadWorkflow } from "@/components/portal/t4-upload-workflow";
import { getCurrentUserRecord } from "@/lib/supabase/server";
import { getT4SlipRows } from "@/lib/tax/t4";

export default async function PortalT4Page() {
  const user = await getCurrentUserRecord();
  const rows = await getT4SlipRows(user.id);

  return (
    <div className="grid gap-6">
      <AccountingHeader
        title="T4 Slips"
        description="Upload a T4 document. KAL Accounting & Tax staff will review it and contact you if more information is needed."
      />
      <T4UploadWorkflow />
      <AccountingTable
        title="Uploaded T4 Slips"
        columns={[
          { key: "document", label: "Document" },
          { key: "documentDate", label: "T4 Date" },
          { key: "year", label: "Tax Year" },
          { key: "box14", label: "Box 14" },
          { key: "box16", label: "Box 16" },
          { key: "box18", label: "Box 18" },
          { key: "box22", label: "Box 22" },
          { key: "uploaded", label: "Uploaded" },
          { key: "status", label: "Status" }
        ]}
        rows={rows}
      />
    </div>
  );
}

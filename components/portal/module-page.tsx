"use client";

import { ExportButtons } from "@/components/portal/export-buttons";
import { DataTable } from "@/components/portal/data-table";
import { UploadCard } from "@/components/portal/upload-card";
import type { DemoRow, TableColumn } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

type ModulePageProps = {
  title: string;
  description: string;
  titleKey?: string;
  descriptionKey?: string;
  eyebrowKey?: string;
  columns: TableColumn[];
  rows: DemoRow[];
  upload?: {
    bucket: "receipts" | "invoices" | "bank-statements" | "immigration-documents" | "tax-documents" | "client-documents";
    documentType: string;
    title?: string;
    taxYear?: number;
  };
  children?: React.ReactNode;
};

export function ModulePage({ title, description, titleKey, descriptionKey, eyebrowKey, columns, rows, upload, children }: ModulePageProps) {
  const { t } = useT();

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">{t(eyebrowKey ?? "common.securePortal")}</p>
          <h1 className="mt-2 text-3xl font-black text-exodus-navy">{titleKey ? t(titleKey) : title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-exodus-slate">{descriptionKey ? t(descriptionKey) : description}</p>
        </div>
        <ExportButtons />
      </div>

      {upload ? <UploadCard {...upload} /> : null}
      {children}
      <DataTable columns={columns} rows={rows} />
    </div>
  );
}

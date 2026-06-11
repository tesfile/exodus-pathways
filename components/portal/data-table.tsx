"use client";

import Link from "next/link";
import type { DemoRow, TableColumn } from "@/lib/types";
import { useT } from "@/lib/i18n/provider";

type DataTableProps = {
  columns: TableColumn[];
  rows: DemoRow[];
};

export function DataTable({ columns, rows }: DataTableProps) {
  const { t } = useT();

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm font-semibold text-exodus-slate">
        No records found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-exodus-light">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] text-exodus-navy">
                  {column.labelKey ? t(column.labelKey) : column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={`${row[columns[0]?.key] ?? "row"}-${index}`} className="hover:bg-slate-50">
                {columns.map((column, columnIndex) => {
                  const cellHref = row[`${column.key}Href`] ?? (columnIndex === 0 ? row.href : "");

                  return (
                    <td key={column.key} className="whitespace-nowrap px-4 py-4 font-medium text-exodus-slate">
                      {cellHref ? (
                        <Link href={cellHref} className="font-black text-exodus-blue underline-offset-4 hover:underline">
                          {row[column.key]}
                        </Link>
                      ) : (
                        row[column.key]
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

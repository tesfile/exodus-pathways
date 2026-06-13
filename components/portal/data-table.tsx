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
    <div className="grid gap-3 md:block">
      <div className="grid gap-3 md:hidden">
        {rows.map((row, index) => {
          const primary = columns[0];
          const primaryHref = row[`${primary.key}Href`] ?? row.href;

          return (
            <article key={`${row[primary.key] ?? "row"}-${index}`} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-exodus-slate">
                    {primary.labelKey ? t(primary.labelKey) : primary.label}
                  </p>
                  {primaryHref ? (
                    <Link href={primaryHref} className="mt-1 block text-base font-black text-exodus-blue underline-offset-4 hover:underline">
                      {row[primary.key]}
                    </Link>
                  ) : (
                    <p className="mt-1 text-base font-black text-exodus-navy">{row[primary.key]}</p>
                  )}
                </div>
              </div>
              <dl className="mt-3 grid gap-2">
                {columns.slice(1).map((column) => {
                  const cellHref = row[`${column.key}Href`];
                  return (
                    <div key={column.key} className="flex items-start justify-between gap-4 border-t border-slate-100 pt-2">
                      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-exodus-slate">
                        {column.labelKey ? t(column.labelKey) : column.label}
                      </dt>
                      <dd className="text-right text-sm font-bold text-exodus-navy">
                        {cellHref ? (
                          <Link href={cellHref} className="text-exodus-blue underline-offset-4 hover:underline">
                            {row[column.key]}
                          </Link>
                        ) : (
                          row[column.key]
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          );
        })}
      </div>
      <div className="hidden overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm md:block">
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
    </div>
  );
}

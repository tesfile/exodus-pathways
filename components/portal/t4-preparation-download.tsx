"use client";

type Row = { label: string; amount: number };
export function T4PreparationDownload({ workerName, year, rows }: { workerName: string; year: number; rows: Row[] }) {
  const download = () => {
    const csvCell = (value: string) => '"' + ( /^[=+@\\-\\t\\r]/.test(value) ? "'" + value : value ).replace(/"/g, '""') + '"';
    const lines = ["T4 preparation report (NOT a CRA T4 slip)", "Employee," + csvCell(workerName), "Tax year," + year, "", "T4 box / item,Amount (CAD)", ...rows.map(r => csvCell(r.label) + "," + r.amount.toFixed(2)), "", "Review all payroll, SIN, CPP2, benefits, and CRA filing requirements before preparing official T4 slips."];
    const blob = new Blob(["\\uFEFF" + lines.join("\\r\\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "t4-preparation-" + year + "-" + workerName.toLowerCase().replace(/[^a-z0-9]+/g,"-") + ".csv";
    a.click(); URL.revokeObjectURL(url);
  };
  return <button type="button" onClick={download} className="w-fit rounded-md bg-blue-900 px-5 py-3 font-bold text-white">Download T4 preparation report (CSV)</button>;
}

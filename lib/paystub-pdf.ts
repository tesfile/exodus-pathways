type PaystubSection = {
  title: string;
  rows: Array<{ label: string; value: string }>;
};

export function createPaystubPdf(sections: PaystubSection[]) {
  const commands: string[] = [];
  let y = 742;

  addText(commands, 54, y, "Exodus Pathways Paystub", 18, "F2");
  y -= 26;
  addText(commands, 54, y, "Prepared payroll information for review and recordkeeping.", 10, "F1");
  y -= 34;

  sections.forEach((section) => {
    addText(commands, 54, y, section.title, 13, "F2");
    y -= 18;

    section.rows.forEach((row) => {
      addText(commands, 72, y, `${row.label}:`, 10, "F2");
      addWrappedText(commands, 220, y, row.value || "-", 10, "F1", 54);
      y -= Math.max(16, 16 * Math.ceil((row.value || "-").length / 54));
    });

    y -= 12;
  });

  addLine(commands, 54, 62, 558, 62);
  addText(commands, 54, 44, "Prepared through Exodus Pathways portal", 10, "F2");

  const stream = commands.join("\n");
  return buildPdf(stream);
}

function addText(commands: string[], x: number, y: number, text: string, size: number, font: "F1" | "F2") {
  commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
}

function addWrappedText(commands: string[], x: number, y: number, text: string, size: number, font: "F1" | "F2", maxLength: number) {
  const lines = wrapText(text || "-", maxLength);
  lines.forEach((line, index) => {
    addText(commands, x, y - index * 16, line, size, font);
  });
}

function addLine(commands: string[], x1: number, y1: number, x2: number, y2: number) {
  commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
}

function wrapText(text: string, maxLength: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : ["-"];
}

function escapePdfText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

function buildPdf(stream: string) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

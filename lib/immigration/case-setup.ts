import { immigrationPrograms } from "@/lib/immigration/programs";

function labelFromKey(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function checklistRowsForProgram(caseId: string, clientId: string, programSlug: string) {
  const program = immigrationPrograms.find((item) => item.slug === programSlug) ?? immigrationPrograms[0];

  return program.documents.map((documentKey) => ({
    case_id: caseId,
    client_id: clientId,
    document_key: documentKey,
    document_label: labelFromKey(documentKey),
    status: "missing"
  }));
}

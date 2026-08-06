export function contractPdfFilename(contractId: string) {
  return `contrato-${contractId.replace(/[^a-z0-9-]/gi, "")}.pdf`;
}

export function contractPdfHeaders(contractId: string, disposition: "inline" | "attachment") {
  return {
    "cache-control": "private, no-store",
    "content-disposition": `${disposition}; filename="${contractPdfFilename(contractId)}"`,
    "content-type": "application/pdf",
    "x-content-type-options": "nosniff",
  };
}

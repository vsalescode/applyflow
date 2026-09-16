import { describe, expect, it } from "vitest";

import {
  PdfTextExtractor,
  ResumeTextExtractionError,
} from "./pdf-text-extractor";

function createTextPdf(text: string) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${new TextEncoder().encode(stream).byteLength} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).byteLength);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).byteLength;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

describe("PdfTextExtractor", () => {
  it("extrai texto e quantidade de páginas", async () => {
    await expect(
      new PdfTextExtractor().extract(createTextPdf("Hello AppyFlow")),
    ).resolves.toEqual({
      text: "Hello AppyFlow",
      pageCount: 1,
    });
  });

  it("rejeita conteúdo que não pode ser interpretado", async () => {
    await expect(
      new PdfTextExtractor().extract(new TextEncoder().encode("%PDF-invalid")),
    ).rejects.toBeInstanceOf(ResumeTextExtractionError);
  });
});

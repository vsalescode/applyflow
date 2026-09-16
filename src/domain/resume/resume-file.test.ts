import { describe, expect, it } from "vitest";

import {
  InvalidResumeFileError,
  maxResumeBytes,
  pdfMediaType,
  validateResumeUpload,
} from "./resume-file";

const validPdf = new TextEncoder().encode("%PDF-1.7\ncontent");

describe("validateResumeUpload", () => {
  it("valida PDF e calcula checksum", () => {
    expect(
      validateResumeUpload({
        name: "curriculo.pdf",
        type: pdfMediaType,
        bytes: validPdf,
      }),
    ).toMatchObject({
      originalName: "curriculo.pdf",
      mediaType: pdfMediaType,
      sizeBytes: validPdf.byteLength,
      checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it.each([
    { name: "curriculo.txt", type: pdfMediaType, bytes: validPdf },
    { name: "curriculo.pdf", type: "text/plain", bytes: validPdf },
    { name: "curriculo.pdf", type: pdfMediaType, bytes: new Uint8Array() },
    {
      name: "curriculo.pdf",
      type: pdfMediaType,
      bytes: new Uint8Array(maxResumeBytes + 1),
    },
    {
      name: "curriculo.pdf",
      type: pdfMediaType,
      bytes: new TextEncoder().encode("not a pdf"),
    },
  ])("rejeita upload inválido %#", (upload) => {
    expect(() => validateResumeUpload(upload)).toThrow(InvalidResumeFileError);
  });
});

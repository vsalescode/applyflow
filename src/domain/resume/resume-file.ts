import { createHash } from "node:crypto";
import { basename } from "node:path";

export const maxResumeBytes = 5 * 1024 * 1024;
export const maxResumePages = 30;
export const maxExtractedTextCharacters = 200_000;
export const pdfMediaType = "application/pdf";

export class InvalidResumeFileError extends Error {}

export interface ResumeUpload {
  name: string;
  type: string;
  bytes: Uint8Array;
}

export function validateResumeUpload(upload: ResumeUpload) {
  const originalName = basename(upload.name.trim());
  if (
    !originalName ||
    originalName.length > 255 ||
    !originalName.toLowerCase().endsWith(".pdf")
  )
    throw new InvalidResumeFileError("Envie um arquivo PDF com nome válido.");
  if (upload.type !== pdfMediaType)
    throw new InvalidResumeFileError("O tipo do arquivo deve ser PDF.");
  if (upload.bytes.byteLength === 0 || upload.bytes.byteLength > maxResumeBytes)
    throw new InvalidResumeFileError("O PDF deve ter no máximo 5 MiB.");
  if (new TextDecoder("ascii").decode(upload.bytes.subarray(0, 5)) !== "%PDF-")
    throw new InvalidResumeFileError("O conteúdo enviado não é um PDF válido.");

  return {
    originalName,
    mediaType: pdfMediaType,
    sizeBytes: upload.bytes.byteLength,
    checksum: createHash("sha256").update(upload.bytes).digest("hex"),
  };
}

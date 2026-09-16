import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import type {
  ExtractedResumeText,
  ResumeTextExtractor,
} from "@/application/resume/resume-text-extractor";
import {
  maxExtractedTextCharacters,
  maxResumePages,
} from "@/domain/resume/resume-file";

export class ResumeTextExtractionError extends Error {}

export class PdfTextExtractor implements ResumeTextExtractor {
  async extract(bytes: Uint8Array): Promise<ExtractedResumeText> {
    const loadingTask = getDocument({
      data: bytes.slice(),
      stopAtErrors: true,
      useSystemFonts: true,
    });

    try {
      const document = await loadingTask.promise;
      if (document.numPages < 1 || document.numPages > maxResumePages)
        throw new ResumeTextExtractionError(
          "O PDF deve ter entre 1 e 30 páginas.",
        );

      const pages: string[] = [];
      for (
        let pageNumber = 1;
        pageNumber <= document.numPages;
        pageNumber += 1
      ) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(
          content.items
            .filter(
              (item): item is typeof item & { str: string } => "str" in item,
            )
            .map((item) => item.str)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim(),
        );
        page.cleanup();
      }

      const text = pages.filter(Boolean).join("\n\n");
      if (!text)
        throw new ResumeTextExtractionError(
          "O PDF não contém texto extraível.",
        );
      if (text.length > maxExtractedTextCharacters)
        throw new ResumeTextExtractionError(
          "O texto extraído excede o limite permitido.",
        );
      return { text, pageCount: document.numPages };
    } catch (error) {
      if (error instanceof ResumeTextExtractionError) throw error;
      throw new ResumeTextExtractionError(
        "Não foi possível extrair o texto do PDF.",
      );
    } finally {
      await loadingTask.destroy();
    }
  }
}

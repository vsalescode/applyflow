export interface ExtractedResumeText {
  text: string;
  pageCount: number;
}

export interface ResumeTextExtractor {
  extract(bytes: Uint8Array): Promise<ExtractedResumeText>;
}

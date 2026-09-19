import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveResumeLanguage } from "@/domain/application/resume-language";
import {
  parseResumeContent,
  type ResumeContent,
} from "@/domain/resume/resume-content";

import { renderEnResume } from "./en-latex-renderer";
import { renderPtBrResume } from "./pt-br-latex-renderer";

export interface ResumeRenderingRequest {
  content: unknown;
  vacancyText: string;
  languageOverride?: string | null;
  preferredLanguages?: readonly string[];
}

export interface ResumeTemplateSelection {
  language: ResumeContent["language"];
  templatePath: string;
}

type TemplateReader = (path: string) => string;

export function selectResumeTemplate(
  vacancyText: string,
  languageOverride?: string | null,
  preferredLanguages: readonly string[] = [],
): ResumeTemplateSelection {
  const language = resolveResumeLanguage(
    vacancyText,
    languageOverride,
    preferredLanguages,
  );
  return {
    language,
    templatePath: join(
      process.cwd(),
      "templates",
      language === "PT_BR" ? "pt-br" : "en",
      "template.tex",
    ),
  };
}

export function renderResumeLatex(
  request: ResumeRenderingRequest,
  readTemplate: TemplateReader = (path) => readFileSync(path, "utf8"),
) {
  const content = parseResumeContent(request.content);
  const selection = selectResumeTemplate(
    request.vacancyText,
    request.languageOverride,
    request.preferredLanguages,
  );
  if (content.language !== selection.language)
    throw new Error(
      `O conteúdo ${content.language} não corresponde ao idioma selecionado ${selection.language}.`,
    );
  const template = readTemplate(selection.templatePath);
  return {
    ...selection,
    latex:
      selection.language === "PT_BR"
        ? renderPtBrResume(template, content)
        : renderEnResume(template, content),
  };
}

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { ResumeContent } from "@/domain/resume/resume-content";

import { escapeLatex, renderPtBrResume } from "./pt-br-latex-renderer";

const template = readFileSync(
  join(process.cwd(), "templates", "pt-br", "template.tex"),
  "utf8",
);
const id = () => randomUUID();

const content: ResumeContent = {
  language: "PT_BR",
  personalInfo: {
    fullName: "João da Silva",
    location: "São Paulo, SP — Brasil",
    phone: "+55 11 99999-9999",
    email: "joao@example.com",
    links: [
      {
        kind: "GITHUB",
        label: "github.com/joao_dev",
        url: "https://github.com/joao_dev",
      },
    ],
  },
  experiences: [
    {
      factId: id(),
      company: "Pesquisa & Desenvolvimento",
      location: "Remoto",
      role: "Engenheiro de Software",
      period: { start: "2024-01", ongoing: true },
      bullets: [{ text: "Melhorou APIs em 25%.", evidenceFactIds: [id()] }],
    },
  ],
  projects: [
    {
      factId: id(),
      name: "Projeto Backend",
      url: "https://example.com/projeto",
      urlLabel: "Projeto",
      technologies: ["Node.js", "PostgreSQL"],
      bullets: [{ text: "Criou integração segura.", evidenceFactIds: [id()] }],
    },
  ],
  skillGroups: [
    { label: "Backend", skills: [{ factId: id(), name: "Node.js" }] },
  ],
  education: [
    {
      factId: id(),
      institution: "Universidade Exemplo",
      qualification: "Engenharia de Software",
      period: { end: "2028-12", ongoing: false },
      expectedCompletion: true,
    },
  ],
  courses: [
    {
      factId: id(),
      name: "Docker",
      provider: "Plataforma",
      status: "IN_PROGRESS",
    },
  ],
  languages: [{ factId: id(), name: "Português", proficiency: "Nativo" }],
};

describe("PT-BR LaTeX renderer", () => {
  it("preserva a estrutura e substitui todo conteúdo de exemplo", () => {
    const output = renderPtBrResume(template, content);

    expect(output).toContain("\\documentclass[a4paper,10pt]{article}");
    expect(output).toContain("\\usepackage[brazil]{babel}");
    expect(output).toContain("{\\LARGE\\textbf{João da Silva}}");
    expect(output).toContain("Pesquisa \\& Desenvolvimento");
    expect(output).toContain("Melhorou APIs em 25\\%.");
    expect(output).toContain("Jan/2024 -- Atual");
    expect(output).not.toContain("Nome Completo do Candidato");
    expect(output).not.toContain("Empresa Exemplo");
  });

  it("remove seções vazias sem remover o fim do documento", () => {
    const output = renderPtBrResume(template, {
      ...content,
      projects: [],
      courses: [],
      languages: [],
    });

    expect(output).not.toContain("\\section{Projetos em Destaque}");
    expect(output).not.toContain("\\section{Cursos Complementares}");
    expect(output).not.toContain("\\section{Idiomas}");
    expect(output).toContain("\\end{document}");
  });

  it("rejeita idioma e template incompatíveis", () => {
    expect(() =>
      renderPtBrResume(template, { ...content, language: "EN" }),
    ).toThrow("exige conteúdo PT_BR");
    expect(() => renderPtBrResume("\\begin{document}", content)).toThrow(
      "Template PT-BR inválido",
    );
  });

  it("escapa todos os caracteres especiais do LaTeX", () => {
    expect(escapeLatex("\\{}$&#_%~^")).toBe(
      "\\textbackslash{}\\{\\}\\$\\&\\#\\_\\%\\textasciitilde{}\\textasciicircum{}",
    );
  });
});

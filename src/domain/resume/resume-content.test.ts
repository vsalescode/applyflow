import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  assertEquivalentResumeFacts,
  createResumePdfFileName,
  parseResumeContent,
  type ResumeContent,
} from "./resume-content";

const experienceId = randomUUID();
const skillId = randomUUID();

const completeResume: ResumeContent = {
  language: "PT_BR",
  personalInfo: {
    fullName: "Pessoa Candidata",
    location: "São Paulo, SP — Brasil",
    phone: "+55 11 99999-9999",
    email: "pessoa@example.com",
    links: [
      {
        kind: "GITHUB",
        label: "github.com/pessoa",
        url: "https://github.com/pessoa",
      },
    ],
  },
  experiences: [
    {
      factId: experienceId,
      company: "Empresa",
      location: "Remoto",
      role: "Desenvolvedor",
      period: { start: "2024-01", ongoing: true },
      bullets: [{ text: "Desenvolveu APIs.", evidenceFactIds: [experienceId] }],
    },
  ],
  projects: [],
  skillGroups: [
    { label: "Linguagens", skills: [{ factId: skillId, name: "TypeScript" }] },
  ],
  education: [],
  courses: [],
  languages: [],
};

describe("ResumeContent", () => {
  it("valida conteúdo comum aos templates PT-BR e EN", () => {
    expect(parseResumeContent(completeResume)).toEqual(completeResume);
    expect(
      parseResumeContent({ ...completeResume, language: "EN" }),
    ).toMatchObject({
      language: "EN",
    });
  });

  it("aceita seções opcionais vazias", () => {
    expect(
      parseResumeContent({
        ...completeResume,
        experiences: [],
        skillGroups: [],
        personalInfo: { fullName: "Pessoa Candidata", links: [] },
      }),
    ).toBeTruthy();
  });

  it("rejeita período atual com data final", () => {
    expect(() =>
      parseResumeContent({
        ...completeResume,
        experiences: [
          {
            ...completeResume.experiences[0],
            period: { start: "2024-01", end: "2025-01", ongoing: true },
          },
        ],
      }),
    ).toThrow("não pode ter data final");
  });

  it("exige evidência para texto narrativo", () => {
    expect(() =>
      parseResumeContent({
        ...completeResume,
        experiences: [
          {
            ...completeResume.experiences[0],
            bullets: [{ text: "Texto sem origem", evidenceFactIds: [] }],
          },
        ],
      }),
    ).toThrow();
  });

  it("gera o nome padronizado do PDF a partir do nome da pessoa", () => {
    expect(createResumePdfFileName("João da Silva")).toBe(
      "CV_JOAO_DA_SILVA.pdf",
    );
    expect(createResumePdfFileName(" Ana  Souza-Lima ")).toBe(
      "CV_ANA_SOUZA_LIMA.pdf",
    );
    expect(() => createResumePdfFileName("---")).toThrow("Nome inválido");
  });

  it("exige que versões em idiomas diferentes usem os mesmos fatos", () => {
    const english = { ...completeResume, language: "EN" as const };
    expect(() =>
      assertEquivalentResumeFacts(completeResume, english),
    ).not.toThrow();
    expect(() =>
      assertEquivalentResumeFacts(completeResume, {
        ...english,
        experiences: [],
      }),
    ).toThrow("mesmos fatos");
  });
});

import { describe, expect, it } from "vitest";

import {
  aiJobMatchOutputSchema,
  parseStoredAIJobMatchAnalysis,
  validateGroundedSkills,
  type AIJobMatchAnalysis,
} from "./ai-matching-service";

const analysis: AIJobMatchAnalysis = {
  matchedSkills: ["TypeScript", "Node.js"],
  missingSkills: ["Kubernetes"],
  strengths: ["Experiência confirmada em backend"],
  gaps: ["Kubernetes não consta no perfil"],
  seniorityMatch: "COMPATIBLE",
  locationMatch: "COMPATIBLE",
  explanation: "A vaga possui boa aderência às evidências confirmadas.",
};

describe("AI job matching", () => {
  it("aceita saída estruturada e skills sustentadas pelas evidências", () => {
    expect(aiJobMatchOutputSchema.parse(analysis)).toEqual(analysis);
    expect(() =>
      validateGroundedSkills(
        analysis,
        ["typescript", "NODE.JS", "PostgreSQL"],
        "Vaga para TypeScript, Node.js e Kubernetes",
      ),
    ).not.toThrow();
  });

  it("rejeita skill correspondente ausente do perfil confirmado", () => {
    expect(() =>
      validateGroundedSkills(
        { ...analysis, matchedSkills: ["Kubernetes"] },
        ["TypeScript"],
        "TypeScript e Kubernetes",
      ),
    ).toThrow("skill correspondente sem evidência");
  });

  it("rejeita skill ausente que não aparece explicitamente na vaga", () => {
    expect(() =>
      validateGroundedSkills(
        { ...analysis, matchedSkills: ["TypeScript"], missingSkills: ["AWS"] },
        ["TypeScript"],
        "TypeScript e Kubernetes",
      ),
    ).toThrow("skill ausente sem evidência");
  });

  it("rejeita skill ausente que já pertence ao perfil confirmado", () => {
    expect(() =>
      validateGroundedSkills(
        {
          ...analysis,
          matchedSkills: [],
          missingSkills: ["Kubernetes"],
        },
        ["Kubernetes"],
        "Kubernetes",
      ),
    ).toThrow("skill ausente sem evidência");
  });

  it("rejeita payload fora do schema", () => {
    expect(() =>
      aiJobMatchOutputSchema.parse({ ...analysis, explanation: "" }),
    ).toThrow();
  });

  it("ignora análise persistida inválida", () => {
    expect(parseStoredAIJobMatchAnalysis(analysis)).toEqual(analysis);
    expect(
      parseStoredAIJobMatchAnalysis({ explanation: "incompleta" }),
    ).toBeNull();
  });
});

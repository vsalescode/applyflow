import { describe, expect, it } from "vitest";

import {
  evaluateQuickFilters,
  type QuickFilterJob,
  type QuickFilterPreferences,
} from "./quick-filter";

const now = new Date("2026-09-16T12:00:00.000Z");
const job: QuickFilterJob = {
  title: "Senior Backend Engineer",
  company: "Acme",
  description: "Node.js and PostgreSQL",
  location: "São Paulo, Brasil",
  workArrangement: "REMOTE",
  publishedAt: new Date("2026-09-14T12:00:00.000Z"),
  discoveredAt: new Date("2026-09-15T12:00:00.000Z"),
};
const preferences: QuickFilterPreferences = {
  desiredRoles: ["Backend Engineer"],
  seniorities: ["SENIOR"],
  workModes: ["REMOTE"],
  locations: ["São Paulo"],
  excludedCompanies: ["Blocked Inc"],
  excludedKeywords: ["voluntário"],
};

describe("quick job filters", () => {
  it("aprova uma vaga compatível com as preferências", () => {
    const result = evaluateQuickFilters(job, preferences, { now });

    expect(result.decision).toBe("ELIGIBLE");
    expect(result.rules.every((rule) => rule.status === "PASS")).toBe(true);
  });

  it.each([
    ["empresa", { company: "Blocked Inc" }, "COMPANY"],
    ["palavra", { description: "Trabalho voluntário" }, "KEYWORD"],
    ["idade", { publishedAt: new Date("2026-06-01T12:00:00.000Z") }, "AGE"],
    ["modalidade", { workArrangement: "ONSITE" as const }, "WORK_MODE"],
    ["senioridade", { title: "Junior Backend Engineer" }, "SENIORITY"],
  ])("rejeita por %s incompatível", (_name, override, code) => {
    const result = evaluateQuickFilters({ ...job, ...override }, preferences, {
      now,
    });

    expect(result.decision).toBe("REJECTED");
    expect(result.rules).toContainEqual(
      expect.objectContaining({ code, status: "REJECT" }),
    );
  });

  it("encaminha dados ausentes ou ambíguos para revisão", () => {
    const result = evaluateQuickFilters(
      {
        ...job,
        title: "Software Developer",
        location: null,
        workArrangement: "UNKNOWN",
      },
      preferences,
      { now },
    );

    expect(result.decision).toBe("REVIEW");
    expect(result.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ROLE", status: "REVIEW" }),
        expect.objectContaining({ code: "LOCATION", status: "REVIEW" }),
        expect.objectContaining({ code: "WORK_MODE", status: "REVIEW" }),
      ]),
    );
  });

  it("usa discoveredAt quando a fonte não informa publicação", () => {
    const result = evaluateQuickFilters(
      {
        ...job,
        publishedAt: null,
        discoveredAt: new Date("2026-07-01T12:00:00.000Z"),
      },
      preferences,
      { now, maxAgeDays: 30 },
    );

    expect(result.rules).toContainEqual(
      expect.objectContaining({ code: "AGE", status: "REJECT" }),
    );
  });

  it("compara texto sem diferenciar caixa ou acentos", () => {
    const result = evaluateQuickFilters(
      { ...job, company: "EMPRESA TECNOLOGIA" },
      { ...preferences, excludedCompanies: ["Empresa Técnologia"] },
      { now },
    );

    expect(result.decision).toBe("REJECTED");
  });
});

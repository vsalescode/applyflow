import { describe, expect, it } from "vitest";

import {
  InvalidSearchResultError,
  normalizeSearchResult,
} from "./normalize-job";

describe("normalizeSearchResult", () => {
  it("normaliza campos explícitos e uma data ISO", () => {
    expect(
      normalizeSearchResult({
        title: "  Backend   Engineer ",
        company: " Example  Inc ",
        location: " São Paulo  - SP ",
        snippet: "Vaga híbrida para nossa equipe.",
        url: "https://JOBS.example.com/vaga/1",
        publishedAt: "2026-09-15",
      }),
    ).toEqual({
      title: "Backend Engineer",
      company: "Example Inc",
      location: "São Paulo - SP",
      description: "Vaga híbrida para nossa equipe.",
      workArrangement: "HYBRID",
      url: "https://jobs.example.com/vaga/1",
      sourceDomain: "jobs.example.com",
      publishedAt: new Date("2026-09-15T00:00:00.000Z"),
      publishedLabel: "2026-09-15",
    });
  });

  it("preserva datas relativas sem convertê-las em timestamp", () => {
    expect(
      normalizeSearchResult({
        title: "Remote Software Engineer",
        url: "https://example.com/jobs/2",
        publishedAt: "2 days ago",
      }),
    ).toMatchObject({
      workArrangement: "REMOTE",
      publishedAt: undefined,
      publishedLabel: "2 days ago",
    });
  });

  it("rejeita URLs que não sejam HTTP ou HTTPS", () => {
    expect(() =>
      normalizeSearchResult({ title: "Engineer", url: "file:///etc/passwd" }),
    ).toThrow(InvalidSearchResultError);
  });
});

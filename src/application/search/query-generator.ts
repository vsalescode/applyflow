import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { AIProvider } from "@/application/providers/ai-provider";
import { getPrismaClient } from "@/infrastructure/database/prisma";

export class InsufficientQueryContextError extends Error {}

export function normalizeSearchQuery(query: string) {
  return query
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

function uniqueQueries(queries: readonly string[]) {
  const seen = new Set<string>();
  return queries
    .map((query) => query.trim().replace(/\s+/g, " "))
    .filter((query) => query.length >= 3 && query.length <= 300)
    .filter((query) => {
      const normalized = normalizeSearchQuery(query);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function withoutExcludedTerms(
  queries: readonly string[],
  excludedTerms: readonly string[],
) {
  const normalizedTerms = excludedTerms.map(normalizeSearchQuery);
  return queries.filter((query) => {
    const normalized = normalizeSearchQuery(query);
    return !normalizedTerms.some((term) => normalized.includes(term));
  });
}

type QueryContext = Awaited<ReturnType<typeof loadContext>>;

async function loadContext(userId: string) {
  return getPrismaClient().candidateProfile.findUnique({
    where: { userId },
    include: {
      preference: true,
      professionalFacts: {
        where: { type: "SKILL", reviewStatus: "CONFIRMED" },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });
}

export function buildDeterministicQueries(context: NonNullable<QueryContext>) {
  const preference = context.preference;
  const roles = preference?.desiredRoles.length
    ? preference.desiredRoles
    : context.headline
      ? [context.headline]
      : [];
  const locations = preference?.locations.slice(0, 3) ?? [];
  const technologies = preference?.technologies.length
    ? preference.technologies.slice(0, 5)
    : context.professionalFacts.map((fact) => fact.title).slice(0, 5);
  const remote = preference?.workModes.includes("REMOTE") ? "remoto" : "";
  const queries: string[] = [];

  for (const role of roles.slice(0, 5)) {
    queries.push([role, remote].filter(Boolean).join(" "));
    for (const location of locations)
      queries.push([role, remote, location].filter(Boolean).join(" "));
    for (const technology of technologies.slice(0, 3))
      queries.push([role, technology, remote].filter(Boolean).join(" "));
  }
  return uniqueQueries(queries).slice(0, 20);
}

async function persistQueries(
  profileId: string,
  queries: readonly string[],
  origin: "DETERMINISTIC" | "AI",
  ai?: { model: string; requestId?: string },
  excludedTerms: readonly string[] = [],
) {
  const values = uniqueQueries(withoutExcludedTerms(queries, excludedTerms));
  if (!values.length) throw new InsufficientQueryContextError();
  await getPrismaClient().searchQuery.createMany({
    data: values.map((query) => ({
      id: randomUUID(),
      profileId,
      query,
      normalized: normalizeSearchQuery(query),
      origin,
      aiModel: ai?.model,
      aiRequestId: ai?.requestId,
    })),
    skipDuplicates: true,
  });
  return listSearchQueriesByProfile(profileId);
}

function listSearchQueriesByProfile(profileId: string) {
  return getPrismaClient().searchQuery.findMany({
    where: { profileId },
    orderBy: [{ createdAt: "desc" }, { query: "asc" }],
  });
}

export async function listSearchQueries(userId: string) {
  return getPrismaClient().searchQuery.findMany({
    where: { profile: { userId } },
    orderBy: [{ createdAt: "desc" }, { query: "asc" }],
  });
}

export async function generateDeterministicQueries(userId: string) {
  const context = await loadContext(userId);
  if (!context) throw new InsufficientQueryContextError();
  return persistQueries(
    context.id,
    buildDeterministicQueries(context),
    "DETERMINISTIC",
    undefined,
    context.preference?.excludedKeywords ?? [],
  );
}

const aiOutput = z.object({
  queries: z.array(z.string().trim().min(3).max(300)).min(1).max(10),
});

export async function generateAIQueries(userId: string, provider: AIProvider) {
  const context = await loadContext(userId);
  if (!context) throw new InsufficientQueryContextError();
  const preference = context.preference;
  const payload = {
    headline: context.headline,
    seniority: context.seniority,
    country: context.country,
    roles: preference?.desiredRoles ?? [],
    preferredSeniorities: preference?.seniorities ?? [],
    workModes: preference?.workModes ?? [],
    locations: preference?.locations ?? [],
    languages: preference?.languages ?? [],
    technologies: preference?.technologies ?? [],
    confirmedSkills: context.professionalFacts.map((fact) => fact.title),
    excludedKeywords: preference?.excludedKeywords ?? [],
  };
  if (!payload.headline && !payload.roles.length)
    throw new InsufficientQueryContextError();

  const result = await provider.generateStructured({
    messages: [
      {
        role: "system",
        content:
          "Gere consultas curtas para localizar vagas compatíveis. Use apenas os dados fornecidos, não invente qualificações e não inclua termos explicitamente excluídos.",
      },
      { role: "user", content: JSON.stringify(payload) },
    ],
    outputSchema: {
      name: "job_search_queries",
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          queries: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: { type: "string", minLength: 3, maxLength: 300 },
          },
        },
        required: ["queries"],
      },
      parse(value) {
        return aiOutput.parse(value);
      },
    },
    maxOutputTokens: 500,
    temperature: 0.2,
  });
  return persistQueries(
    context.id,
    result.output.queries,
    "AI",
    {
      model: result.model,
      requestId: result.requestId,
    },
    preference?.excludedKeywords ?? [],
  );
}

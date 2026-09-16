import { z } from "zod";

import type { SearchResultItem } from "@/application/providers/search-provider";

export class InvalidSearchResultError extends Error {}

const text = (maximum: number) =>
  z.string().trim().min(1).max(maximum).optional();

const resultSchema = z.object({
  title: z.string().trim().min(1).max(300),
  url: z.url().max(2048),
  snippet: text(20_000),
  publishedAt: text(100),
  company: text(200),
  location: text(200),
});

export interface NormalizedJob {
  title: string;
  company?: string;
  description?: string;
  location?: string;
  workArrangement: "UNKNOWN" | "REMOTE" | "HYBRID" | "ONSITE";
  url: string;
  sourceDomain: string;
  publishedAt?: Date;
  publishedLabel?: string;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function inferWorkArrangement(value: string): NormalizedJob["workArrangement"] {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (/\b(hybrid|hibrid[oa])\b/.test(normalized)) return "HYBRID";
  if (/\b(remote|remot[oa])\b/.test(normalized)) return "REMOTE";
  if (/\b(on[- ]?site|presencial)\b/.test(normalized)) return "ONSITE";
  return "UNKNOWN";
}

function parsePublishedDate(value: string | undefined) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return undefined;
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function normalizeSearchResult(item: SearchResultItem): NormalizedJob {
  const parsed = resultSchema.safeParse(item);
  if (!parsed.success) throw new InvalidSearchResultError();
  const url = new URL(parsed.data.url);
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new InvalidSearchResultError();
  const title = normalizeWhitespace(parsed.data.title);
  const company = parsed.data.company
    ? normalizeWhitespace(parsed.data.company)
    : undefined;
  const description = parsed.data.snippet
    ? normalizeWhitespace(parsed.data.snippet)
    : undefined;
  const location = parsed.data.location
    ? normalizeWhitespace(parsed.data.location)
    : undefined;
  const publishedLabel = parsed.data.publishedAt
    ? normalizeWhitespace(parsed.data.publishedAt)
    : undefined;
  return {
    title,
    company,
    description,
    location,
    workArrangement: inferWorkArrangement(
      [title, description, location].filter(Boolean).join(" "),
    ),
    url: url.toString(),
    sourceDomain: url.hostname.toLowerCase(),
    publishedAt: parsePublishedDate(publishedLabel),
    publishedLabel,
  };
}

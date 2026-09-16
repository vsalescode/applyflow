import { randomUUID } from "node:crypto";

import type { SearchResultItem } from "@/application/providers/search-provider";
import {
  InvalidSearchResultError,
  normalizeSearchResult,
  type NormalizedJob,
} from "@/domain/job/normalize-job";
import { getPrismaClient } from "@/infrastructure/database/prisma";

export interface NormalizationSummary {
  stored: number;
  rejected: number;
}

export async function normalizeAndStoreSearchResults(
  searchQueryId: string,
  provider: string,
  items: readonly SearchResultItem[],
  clock: () => Date = () => new Date(),
): Promise<NormalizationSummary> {
  if (!provider.trim()) throw new Error("Provider is required");
  const valid: NormalizedJob[] = [];
  let rejected = 0;
  for (const item of items) {
    try {
      valid.push(normalizeSearchResult(item));
    } catch (error) {
      if (!(error instanceof InvalidSearchResultError)) throw error;
      rejected += 1;
    }
  }

  const prisma = getPrismaClient();
  await prisma.$transaction(async (transaction) => {
    for (const job of valid) {
      const source = await transaction.source.upsert({
        where: {
          provider_domain: {
            provider: provider.trim(),
            domain: job.sourceDomain,
          },
        },
        create: {
          id: randomUUID(),
          provider: provider.trim(),
          domain: job.sourceDomain,
        },
        update: {},
      });
      await transaction.job.create({
        data: {
          id: randomUUID(),
          searchQueryId,
          sourceId: source.id,
          title: job.title,
          company: job.company,
          description: job.description,
          location: job.location,
          workArrangement: job.workArrangement,
          url: job.url,
          publishedAt: job.publishedAt,
          publishedLabel: job.publishedLabel,
          discoveredAt: clock(),
        },
      });
    }
  });
  return { stored: valid.length, rejected };
}

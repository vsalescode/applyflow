import { randomUUID } from "node:crypto";

import type { SearchResultItem } from "@/application/providers/search-provider";
import {
  InvalidSearchResultError,
  createJobFingerprint,
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
    const query = await transaction.searchQuery.findUniqueOrThrow({
      where: { id: searchQueryId },
      select: { profileId: true },
    });
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
      const fingerprint = createJobFingerprint(job);
      const storedJob = await transaction.job.upsert({
        where: {
          profileId_fingerprint: {
            profileId: query.profileId,
            fingerprint,
          },
        },
        create: {
          id: randomUUID(),
          profileId: query.profileId,
          fingerprint,
          title: job.title,
          company: job.company,
          description: job.description,
          location: job.location,
          workArrangement: job.workArrangement,
          publishedAt: job.publishedAt,
          discoveredAt: clock(),
        },
        update: {},
      });
      await transaction.jobOccurrence.upsert({
        where: {
          searchQueryId_sourceId_canonicalUrl: {
            searchQueryId,
            sourceId: source.id,
            canonicalUrl: job.canonicalUrl,
          },
        },
        create: {
          id: randomUUID(),
          jobId: storedJob.id,
          searchQueryId,
          sourceId: source.id,
          originalUrl: job.originalUrl,
          canonicalUrl: job.canonicalUrl,
          publishedLabel: job.publishedLabel,
          discoveredAt: clock(),
        },
        update: {},
      });
    }
  });
  return { stored: valid.length, rejected };
}

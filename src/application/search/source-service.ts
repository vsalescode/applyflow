import { getPrismaClient } from "@/infrastructure/database/prisma";
import { calculateSourceScore } from "@/domain/source/source-score";

export async function listDiscoveredSources(
  userId: string,
  clock: () => Date = () => new Date(),
) {
  const sources = await getPrismaClient().source.findMany({
    where: { occurrences: { some: { job: { profile: { userId } } } } },
    include: {
      metricHistory: {
        orderBy: { observedAt: "desc" },
        take: 10,
      },
    },
    orderBy: { domain: "asc" },
  });

  return sources
    .map((source) => ({
      ...source,
      score: calculateSourceScore(source, clock()),
    }))
    .sort(
      (left, right) =>
        right.score.value - left.score.value ||
        left.domain.localeCompare(right.domain),
    );
}

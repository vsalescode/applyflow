import { getPrismaClient } from "@/infrastructure/database/prisma";

export function listDiscoveredSources(userId: string) {
  return getPrismaClient().source.findMany({
    where: { occurrences: { some: { job: { profile: { userId } } } } },
    include: {
      metricHistory: {
        orderBy: { observedAt: "desc" },
        take: 10,
      },
    },
    orderBy: [{ lastSeenAt: "desc" }, { domain: "asc" }],
  });
}

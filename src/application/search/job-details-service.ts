import { getPrismaClient } from "@/infrastructure/database/prisma";

import { parseStoredAIJobMatchAnalysis } from "./ai-matching-service";

export async function getJobDetails(userId: string, jobId: string) {
  const job = await getPrismaClient().job.findFirst({
    where: { id: jobId, profile: { userId } },
    include: {
      match: true,
      application: {
        include: {
          history: { orderBy: { changedAt: "desc" } },
          preparation: true,
        },
      },
      occurrences: {
        orderBy: { discoveredAt: "desc" },
        include: {
          source: { select: { domain: true, provider: true, kind: true } },
          searchQuery: { select: { query: true } },
        },
      },
    },
  });
  if (!job) return null;
  return {
    ...job,
    aiAnalysis: parseStoredAIJobMatchAnalysis(job.match?.aiAnalysis),
  };
}

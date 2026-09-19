import { z } from "zod";

import { getPrismaClient } from "@/infrastructure/database/prisma";

const filterSchema = z.object({
  category: z.enum(["ALL", "NEW", "HOT", "WARM", "COLD"]).catch("ALL"),
  workMode: z
    .enum(["ALL", "REMOTE", "HYBRID", "ONSITE", "UNKNOWN"])
    .catch("ALL"),
  query: z.string().trim().max(120).catch(""),
});

export function parseOpportunityDashboardFilter(input: unknown) {
  return filterSchema.parse(input);
}

export async function getOpportunityDashboard(userId: string, input: unknown) {
  const filter = parseOpportunityDashboardFilter(input);
  const prisma = getPrismaClient();
  const baseWhere = { profile: { userId } };
  const categoryWhere =
    filter.category === "NEW"
      ? { match: { is: null } }
      : filter.category === "ALL"
        ? {}
        : { match: { is: { classification: filter.category } } };
  const workModeWhere =
    filter.workMode === "ALL" ? {} : { workArrangement: filter.workMode };
  const queryWhere = filter.query
    ? {
        OR: [
          { title: { contains: filter.query, mode: "insensitive" as const } },
          { company: { contains: filter.query, mode: "insensitive" as const } },
          {
            location: { contains: filter.query, mode: "insensitive" as const },
          },
        ],
      }
    : {};

  const [jobs, total, newCount, hot, warm, cold] = await Promise.all([
    prisma.job.findMany({
      where: {
        ...baseWhere,
        ...categoryWhere,
        ...workModeWhere,
        ...queryWhere,
      },
      include: {
        match: true,
        application: true,
        occurrences: {
          orderBy: { discoveredAt: "desc" },
          take: 1,
          include: { source: { select: { domain: true } } },
        },
      },
      orderBy: [{ match: { score: "desc" } }, { discoveredAt: "desc" }],
      take: 50,
    }),
    prisma.job.count({ where: baseWhere }),
    prisma.job.count({ where: { ...baseWhere, match: { is: null } } }),
    prisma.job.count({
      where: { ...baseWhere, match: { is: { classification: "HOT" } } },
    }),
    prisma.job.count({
      where: { ...baseWhere, match: { is: { classification: "WARM" } } },
    }),
    prisma.job.count({
      where: { ...baseWhere, match: { is: { classification: "COLD" } } },
    }),
  ]);

  return {
    filter,
    jobs,
    counts: { ALL: total, NEW: newCount, HOT: hot, WARM: warm, COLD: cold },
  };
}

import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getPrismaClient } from "@/infrastructure/database/prisma";
import { normalizeAndStoreSearchResults } from "./job-normalization-service";

const prisma = getPrismaClient();

beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.source.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createQuery() {
  const userId = randomUUID();
  const profileId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      email: `${randomUUID()}@example.com`,
      passwordHash: "not-used-in-this-test",
      candidateProfile: { create: { id: profileId } },
    },
  });
  return prisma.searchQuery.create({
    data: {
      id: randomUUID(),
      profileId,
      query: "backend engineer remoto",
      normalized: "backend engineer remoto",
      origin: "DETERMINISTIC",
    },
  });
}

describe("job normalization service", () => {
  it("persiste vagas normalizadas e reutiliza a fonte", async () => {
    const query = await createQuery();
    const discoveredAt = new Date("2026-09-16T12:00:00.000Z");
    const summary = await normalizeAndStoreSearchResults(
      query.id,
      "serper",
      [
        {
          title: "Backend Engineer",
          company: "Example",
          location: "Remote - Brazil",
          snippet: "TypeScript and PostgreSQL",
          url: "https://jobs.example.com/1",
          publishedAt: "2026-09-15",
        },
        {
          title: "Software Engineer",
          url: "https://jobs.example.com/2",
        },
        { title: "Invalid", url: "file:///private/result" },
      ],
      () => discoveredAt,
    );

    expect(summary).toEqual({ stored: 2, rejected: 1 });
    await expect(prisma.source.count()).resolves.toBe(1);
    await expect(
      prisma.job.findFirst({ where: { title: "Backend Engineer" } }),
    ).resolves.toMatchObject({
      company: "Example",
      location: "Remote - Brazil",
      workArrangement: "REMOTE",
      url: "https://jobs.example.com/1",
      publishedAt: new Date("2026-09-15T00:00:00.000Z"),
      discoveredAt,
    });
    await expect(prisma.job.count()).resolves.toBe(2);
  });

  it("não deduplica resultados nesta etapa", async () => {
    const query = await createQuery();
    const item = { title: "Engineer", url: "https://example.com/job/1" };
    await normalizeAndStoreSearchResults(query.id, "serper", [item, item]);
    await expect(prisma.job.count()).resolves.toBe(2);
  });
});

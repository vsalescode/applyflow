import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getPrismaClient } from "@/infrastructure/database/prisma";

import { updateApplicationStatus } from "./application-service";

const prisma = getPrismaClient();

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createJob() {
  const userId = randomUUID();
  const jobId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      email: `${randomUUID()}@example.com`,
      passwordHash: "test",
      candidateProfile: {
        create: {
          id: randomUUID(),
          jobs: {
            create: {
              id: jobId,
              fingerprint: "a".repeat(64),
              title: "Backend Engineer",
            },
          },
        },
      },
    },
  });
  return { userId, jobId };
}

describe("application pipeline persistence", () => {
  it("atualiza o estado e mantém histórico append-only", async () => {
    const { userId, jobId } = await createJob();
    const firstChange = new Date("2026-09-18T12:00:00.000Z");
    const secondChange = new Date("2026-09-18T13:00:00.000Z");

    await updateApplicationStatus(
      userId,
      jobId,
      "INTERESTING",
      () => firstChange,
    );
    await updateApplicationStatus(userId, jobId, "APPLIED", () => secondChange);

    await expect(
      prisma.application.findUnique({
        where: { jobId },
        include: { history: { orderBy: { changedAt: "asc" } } },
      }),
    ).resolves.toMatchObject({
      status: "APPLIED",
      history: [
        {
          fromStatus: "FOUND",
          toStatus: "INTERESTING",
          changedAt: firstChange,
        },
        {
          fromStatus: "INTERESTING",
          toStatus: "APPLIED",
          changedAt: secondChange,
        },
      ],
    });
  });

  it("não persiste uma transição inválida", async () => {
    const { userId, jobId } = await createJob();

    await expect(
      updateApplicationStatus(userId, jobId, "OFFER"),
    ).rejects.toThrow("não permitida");
    await expect(prisma.application.count()).resolves.toBe(0);
  });
});

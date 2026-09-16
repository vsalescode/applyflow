import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createPrismaClient } from "./prisma";

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL é obrigatória para testes de integração");
}

const prisma = createPrismaClient(databaseUrl);

describe("persistência do usuário único", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persiste e recupera o usuário principal", async () => {
    const created = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: "owner@example.com",
        displayName: "Owner",
      },
    });

    await expect(
      prisma.user.findUnique({ where: { id: created.id } }),
    ).resolves.toMatchObject({
      email: "owner@example.com",
      displayName: "Owner",
      installationKey: "primary",
    });
  });

  it("impede um segundo usuário principal", async () => {
    await prisma.user.create({
      data: { id: randomUUID(), email: "first@example.com" },
    });

    await expect(
      prisma.user.create({
        data: { id: randomUUID(), email: "second@example.com" },
      }),
    ).rejects.toThrow();

    await expect(prisma.user.count()).resolves.toBe(1);
  });

  it("impede contornar o usuário único com outra chave", async () => {
    await expect(
      prisma.user.create({
        data: {
          id: randomUUID(),
          email: "secondary@example.com",
          installationKey: "secondary",
        },
      }),
    ).rejects.toThrow();
  });
});

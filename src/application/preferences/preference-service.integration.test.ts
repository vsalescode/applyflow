import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getPrismaClient } from "@/infrastructure/database/prisma";
import { getPreference, savePreference } from "./preference-service";

const prisma = getPrismaClient();

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("preference service", () => {
  it("cria o perfil quando necessário e mantém uma preferência por perfil", async () => {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${randomUUID()}@example.com`,
        passwordHash: "not-used-in-this-test",
      },
    });
    const base = {
      desiredRoles: ["Backend Engineer"],
      seniorities: ["SENIOR"],
      workModes: ["REMOTE"],
      locations: ["Brasil"],
      languages: ["Português", "Inglês"],
      technologies: ["TypeScript"],
      excludedCompanies: [],
      excludedKeywords: ["voluntário"],
    };

    await savePreference(user.id, base);
    await savePreference(user.id, {
      ...base,
      technologies: ["TypeScript", "PostgreSQL"],
      salaryMinimum: "12000",
      salaryCurrency: "BRL",
    });

    await expect(getPreference(user.id)).resolves.toMatchObject({
      desiredRoles: ["Backend Engineer"],
      workModes: ["REMOTE"],
      technologies: ["TypeScript", "PostgreSQL"],
      salaryCurrency: "BRL",
    });
    await expect(prisma.preference.count()).resolves.toBe(1);
    await expect(prisma.candidateProfile.count()).resolves.toBe(1);
  });
});

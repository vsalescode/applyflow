import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  addProfessionalFact,
  deleteProfessionalFact,
  getCandidateProfile,
  InvalidProfileError,
  saveCandidateProfile,
} from "./profile-service";
import { getPrismaClient } from "@/infrastructure/database/prisma";

const prisma = getPrismaClient();

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createUser() {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${randomUUID()}@example.com`,
      passwordHash: "not-used-in-this-test",
    },
  });
}

describe("profile service", () => {
  it("salva um perfil único e atualiza seus dados", async () => {
    const user = await createUser();
    await saveCandidateProfile(user.id, {
      headline: "Backend Engineer",
      summary: "APIs e sistemas distribuídos",
      seniority: "SENIOR",
      city: "São Paulo",
      region: "SP",
      country: "br",
    });
    await saveCandidateProfile(user.id, {
      headline: "Staff Backend Engineer",
      seniority: "LEAD",
      country: "BR",
    });

    await expect(getCandidateProfile(user.id)).resolves.toMatchObject({
      headline: "Staff Backend Engineer",
      seniority: "LEAD",
      country: "BR",
    });
    await expect(
      prisma.candidateProfile.count({ where: { userId: user.id } }),
    ).resolves.toBe(1);
  });

  it("registra skills e experiências como fatos confirmados", async () => {
    const user = await createUser();
    const skill = await addProfessionalFact(user.id, {
      type: "SKILL",
      title: "TypeScript",
    });
    await addProfessionalFact(user.id, {
      type: "EXPERIENCE",
      title: "Backend Engineer",
      organization: "Example",
      startedAt: "2024-01-01",
      description: "Desenvolvimento de APIs",
    });

    const profile = await getCandidateProfile(user.id);
    expect(profile?.professionalFacts).toHaveLength(2);
    expect(
      profile?.professionalFacts.every(
        (fact) => fact.reviewStatus === "CONFIRMED",
      ),
    ).toBe(true);
    await deleteProfessionalFact(user.id, skill.id);
    await expect(
      prisma.professionalFact.findUnique({ where: { id: skill.id } }),
    ).resolves.toBeNull();
  });

  it("rejeita experiência sem empresa e datas invertidas", async () => {
    const user = await createUser();
    await expect(
      addProfessionalFact(user.id, {
        type: "EXPERIENCE",
        title: "Engineer",
        startedAt: "2025-01-01",
        endedAt: "2024-01-01",
      }),
    ).rejects.toBeInstanceOf(InvalidProfileError);
  });
});

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getPrismaClient } from "@/infrastructure/database/prisma";

export class InvalidPreferenceError extends Error {}

const listSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(50)
  .transform((items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.toLocaleLowerCase("pt-BR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

const preferenceSchema = z
  .object({
    desiredRoles: listSchema,
    seniorities: z
      .array(
        z.enum([
          "INTERN",
          "JUNIOR",
          "MID_LEVEL",
          "SENIOR",
          "LEAD",
          "MANAGER",
          "EXECUTIVE",
        ]),
      )
      .max(7),
    workModes: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])).max(3),
    locations: listSchema,
    languages: listSchema,
    technologies: listSchema,
    salaryMinimum: z
      .string()
      .trim()
      .regex(/^\d+(?:[.,]\d{1,2})?$/)
      .optional(),
    salaryCurrency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .optional(),
    excludedCompanies: listSchema,
    excludedKeywords: listSchema,
  })
  .superRefine((data, context) => {
    if (Boolean(data.salaryMinimum) !== Boolean(data.salaryCurrency))
      context.addIssue({
        code: "custom",
        path: [data.salaryMinimum ? "salaryCurrency" : "salaryMinimum"],
        message: "valor e moeda devem ser informados juntos",
      });
  });

export type PreferenceInput = z.input<typeof preferenceSchema>;

export function parsePreferenceInput(input: unknown) {
  const parsed = preferenceSchema.safeParse(input);
  if (!parsed.success) throw new InvalidPreferenceError();
  return {
    ...parsed.data,
    salaryMinimum: parsed.data.salaryMinimum?.replace(",", "."),
  };
}

export function getPreference(userId: string) {
  return getPrismaClient().preference.findFirst({
    where: { profile: { userId } },
  });
}

export async function savePreference(userId: string, input: unknown) {
  const data = parsePreferenceInput(input);
  const prisma = getPrismaClient();
  const profile = await prisma.candidateProfile.upsert({
    where: { userId },
    create: { id: randomUUID(), userId },
    update: {},
  });
  return prisma.preference.upsert({
    where: { profileId: profile.id },
    create: { id: randomUUID(), profileId: profile.id, ...data },
    update: data,
  });
}

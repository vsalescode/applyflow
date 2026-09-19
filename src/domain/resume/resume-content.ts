import { z } from "zod";

const text = (maximum = 500) => z.string().trim().min(1).max(maximum);
const optionalText = (maximum = 500) => text(maximum).optional();
const factId = z.uuid();
const yearMonth = z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/);

const periodSchema = z
  .object({
    start: yearMonth.optional(),
    end: yearMonth.optional(),
    ongoing: z.boolean(),
  })
  .superRefine((period, context) => {
    if (period.ongoing && period.end)
      context.addIssue({
        code: "custom",
        path: ["end"],
        message: "um período atual não pode ter data final",
      });
    if (period.start && period.end && period.end < period.start)
      context.addIssue({
        code: "custom",
        path: ["end"],
        message: "a data final deve ser posterior à inicial",
      });
  });

const evidenceTextSchema = z.object({
  text: text(2_000),
  evidenceFactIds: z.array(factId).min(1).max(20),
});

export const resumeContentSchema = z.object({
  language: z.enum(["PT_BR", "EN"]),
  personalInfo: z.object({
    fullName: text(160),
    location: optionalText(200),
    phone: optionalText(50),
    email: z.email().max(320).optional(),
    links: z
      .array(
        z.object({
          kind: z.enum(["GITHUB", "LINKEDIN", "PORTFOLIO", "OTHER"]),
          label: text(200),
          url: z.url().max(2_048),
        }),
      )
      .max(10),
  }),
  experiences: z
    .array(
      z.object({
        factId,
        company: text(160),
        location: optionalText(200),
        role: text(160),
        period: periodSchema,
        bullets: z.array(evidenceTextSchema).min(1).max(12),
      }),
    )
    .max(20),
  projects: z
    .array(
      z.object({
        factId,
        name: text(200),
        url: z.url().max(2_048).optional(),
        urlLabel: optionalText(80),
        technologies: z.array(text(80)).max(30),
        bullets: z.array(evidenceTextSchema).min(1).max(12),
      }),
    )
    .max(20),
  skillGroups: z
    .array(
      z.object({
        label: text(120),
        skills: z
          .array(z.object({ factId, name: text(120) }))
          .min(1)
          .max(40),
      }),
    )
    .max(20),
  education: z
    .array(
      z.object({
        factId,
        institution: text(200),
        location: optionalText(200),
        qualification: text(200),
        period: periodSchema,
        expectedCompletion: z.boolean(),
      }),
    )
    .max(10),
  courses: z
    .array(
      z.object({
        factId,
        name: text(200),
        provider: optionalText(160),
        status: z.enum(["COMPLETED", "IN_PROGRESS"]),
      }),
    )
    .max(30),
  languages: z
    .array(
      z.object({
        factId,
        name: text(80),
        proficiency: text(80),
      }),
    )
    .max(20),
});

export type ResumeContent = z.infer<typeof resumeContentSchema>;

export function parseResumeContent(value: unknown) {
  return resumeContentSchema.parse(value);
}

export function createResumePdfFileName(fullName: string) {
  const normalizedName = fullName
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!normalizedName)
    throw new Error("Nome inválido para o arquivo do currículo.");
  return `CV_${normalizedName}.pdf`;
}

export function assertEquivalentResumeFacts(
  first: ResumeContent,
  second: ResumeContent,
) {
  const firstIds = collectFactIds(first);
  const secondIds = collectFactIds(second);
  if (
    firstIds.length !== secondIds.length ||
    firstIds.some((id, index) => id !== secondIds[index])
  )
    throw new Error("As versões do currículo não representam os mesmos fatos.");
}

function collectFactIds(content: ResumeContent) {
  return [
    ...content.experiences.flatMap((item) => [
      item.factId,
      ...item.bullets.flatMap((bullet) => bullet.evidenceFactIds),
    ]),
    ...content.projects.flatMap((item) => [
      item.factId,
      ...item.bullets.flatMap((bullet) => bullet.evidenceFactIds),
    ]),
    ...content.skillGroups.flatMap((group) =>
      group.skills.map((skill) => skill.factId),
    ),
    ...content.education.map((item) => item.factId),
    ...content.courses.map((item) => item.factId),
    ...content.languages.map((item) => item.factId),
  ]
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .sort();
}

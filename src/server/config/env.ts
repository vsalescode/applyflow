import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.url(),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "deve usar o protocolo postgresql:// ou postgres://",
    ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class InvalidEnvironmentError extends Error {
  constructor(public readonly issues: readonly string[]) {
    super(`Configuração de ambiente inválida: ${issues.join("; ")}`);
    this.name = "InvalidEnvironmentError";
  }
}

export type Environment = Readonly<Record<string, string | undefined>>;

export function parseServerEnv(environment: Environment): ServerEnv {
  const result = serverEnvSchema.safeParse(environment);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const field = issue.path.join(".") || "ambiente";
      return `${field}: ${issue.message}`;
    });

    throw new InvalidEnvironmentError(issues);
  }

  return result.data;
}

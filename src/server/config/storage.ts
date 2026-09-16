import { resolve } from "node:path";

import { z } from "zod";

import type { Environment } from "./env";

const storageEnvironmentSchema = z.object({
  ARTIFACTS_DIR: z.string().trim().min(1).default(".data/artifacts"),
});

export function parseStorageConfiguration(environment: Environment) {
  const result = storageEnvironmentSchema.safeParse(environment);
  if (!result.success)
    throw new Error("Configuração de armazenamento inválida.");
  return { artifactsDirectory: resolve(result.data.ARTIFACTS_DIR) };
}

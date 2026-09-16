import type { AIProvider } from "@/application/providers/ai-provider";
import { parseProviderConfiguration } from "@/server/config/providers";

import { OpenAIProvider } from "./openai-provider";

export function getAIProvider(environment = process.env): AIProvider | null {
  const configuration = parseProviderConfiguration(environment).ai;
  if (!configuration.enabled) return null;
  if (configuration.provider !== "openai")
    throw new Error("O provider de IA configurado ainda não possui adapter.");
  return new OpenAIProvider(configuration.apiKey, configuration.model);
}

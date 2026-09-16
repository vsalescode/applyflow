import type { SearchProvider } from "@/application/providers/search-provider";
import type { Environment } from "@/server/config/env";
import { parseProviderConfiguration } from "@/server/config/providers";

import { SerperSearchProvider } from "./serper-search-provider";

export function getSearchProvider(
  environment: Environment = process.env,
): SearchProvider | null {
  const configuration = parseProviderConfiguration(environment).search;
  if (!configuration.enabled) return null;
  if (configuration.provider !== "serper")
    throw new Error(
      "O provider de busca configurado ainda não possui adapter.",
    );
  return new SerperSearchProvider(configuration.apiKey);
}

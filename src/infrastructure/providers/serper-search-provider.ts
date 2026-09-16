import { z } from "zod";

import type {
  SearchProvider,
  SearchRequest,
  SearchResult,
} from "@/application/providers/search-provider";
import type { ProviderHealth } from "@/application/providers/provider-health";

const searchResponseSchema = z.object({
  organic: z
    .array(
      z.object({
        title: z.string().min(1),
        link: z.url(),
        snippet: z.string().optional(),
        displayedLink: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export type SearchProviderFailure =
  "authentication" | "rate_limit" | "timeout" | "upstream" | "invalid_response";

export class SearchProviderError extends Error {
  constructor(public readonly reason: SearchProviderFailure) {
    super(`Falha no provider de busca: ${reason}`);
    this.name = "SearchProviderError";
  }
}

type Fetch = typeof fetch;

export class SerperSearchProvider implements SearchProvider {
  readonly name = "serper";

  constructor(
    private readonly apiKey: string,
    private readonly fetchImplementation: Fetch = fetch,
  ) {}

  async search(request: SearchRequest): Promise<SearchResult> {
    if (!request.query.trim() || request.limit < 1 || request.limit > 10)
      throw new SearchProviderError("invalid_response");
    const page = request.page ?? 1;
    if (!Number.isInteger(page) || page < 1)
      throw new SearchProviderError("invalid_response");

    const response = await this.requestWithRetry(
      "https://google.serper.dev/search",
      {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: request.query.trim(),
          gl: request.country?.toLowerCase(),
          hl: request.language,
          page,
          num: request.limit,
        }),
      },
    );
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new SearchProviderError("invalid_response");
    }
    const parsed = searchResponseSchema.safeParse(body);
    if (!parsed.success) throw new SearchProviderError("invalid_response");
    const items = parsed.data.organic.slice(0, request.limit).map((item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayedUrl: item.displayedLink,
      publishedAt: item.date,
    }));
    return {
      items,
      nextPage: items.length === request.limit ? page + 1 : undefined,
      requestId: response.headers.get("x-request-id") ?? undefined,
    };
  }

  async checkHealth(): Promise<ProviderHealth> {
    try {
      await this.requestWithRetry("https://google.serper.dev/account", {
        headers: { "X-API-KEY": this.apiKey },
      });
      return { status: "available" };
    } catch (error) {
      if (error instanceof SearchProviderError)
        return {
          status: "unavailable",
          reason:
            error.reason === "authentication"
              ? "authentication"
              : error.reason === "timeout"
                ? "timeout"
                : "upstream",
        };
      return { status: "unavailable", reason: "upstream" };
    }
  }

  private async requestWithRetry(url: string, init: RequestInit) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.fetchImplementation(url, {
          ...init,
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) return response;
        if (response.status === 401 || response.status === 403)
          throw new SearchProviderError("authentication");
        if (response.status === 429 && attempt === 1)
          throw new SearchProviderError("rate_limit");
        if (response.status < 500 && response.status !== 429)
          throw new SearchProviderError("upstream");
        if (attempt === 1) throw new SearchProviderError("upstream");
      } catch (error) {
        if (error instanceof SearchProviderError) throw error;
        if (attempt === 1) throw new SearchProviderError("timeout");
      }
    }
    throw new SearchProviderError("upstream");
  }
}

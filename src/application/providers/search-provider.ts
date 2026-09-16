import type { ProviderHealth } from "./provider-health";

export interface SearchRequest {
  query: string;
  country?: string;
  language?: string;
  page?: number;
  limit: number;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet?: string;
  displayedUrl?: string;
  publishedAt?: string;
  company?: string;
  location?: string;
}

export interface SearchResult {
  items: readonly SearchResultItem[];
  nextPage?: number;
  requestId?: string;
}

export interface SearchProvider {
  readonly name: string;
  search(request: SearchRequest): Promise<SearchResult>;
  checkHealth(): Promise<ProviderHealth>;
}

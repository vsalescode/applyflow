import type { ProviderHealth } from "./provider-health";

export interface StructuredOutputSchema<Output> {
  name: string;
  jsonSchema: Record<string, unknown>;
  parse(value: unknown): Output;
}

export interface AIMessage {
  role: "system" | "user";
  content: string;
}

export interface AIGenerationRequest<Output> {
  messages: readonly AIMessage[];
  outputSchema: StructuredOutputSchema<Output>;
  maxOutputTokens: number;
  temperature?: number;
}

export interface AIGenerationResult<Output> {
  output: Output;
  model: string;
  requestId?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIProvider {
  readonly name: string;
  generateStructured<Output>(
    request: AIGenerationRequest<Output>,
  ): Promise<AIGenerationResult<Output>>;
  checkHealth(): Promise<ProviderHealth>;
}

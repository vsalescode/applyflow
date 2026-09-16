import type {
  AIGenerationRequest,
  AIGenerationResult,
  AIProvider,
} from "@/application/providers/ai-provider";
import type { ProviderHealth } from "@/application/providers/provider-health";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generateStructured<Output>(
    request: AIGenerationRequest<Output>,
  ): Promise<AIGenerationResult<Output>> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        input: request.messages,
        max_output_tokens: request.maxOutputTokens,
        temperature: request.temperature,
        text: {
          format: {
            type: "json_schema",
            name: request.outputSchema.name,
            strict: true,
            schema: request.outputSchema.jsonSchema,
          },
        },
      }),
    });
    if (!response.ok) throw new Error("OpenAI request failed");
    const data = (await response.json()) as {
      id: string;
      model: string;
      output_text?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    if (!data.output_text)
      throw new Error("OpenAI returned no structured output");
    return {
      output: request.outputSchema.parse(JSON.parse(data.output_text)),
      model: data.model,
      requestId: data.id,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      },
    };
  }

  async checkHealth(): Promise<ProviderHealth> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        signal: AbortSignal.timeout(5_000),
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok
        ? { status: "available" }
        : { status: "unavailable", reason: "authentication" };
    } catch {
      return { status: "unavailable", reason: "timeout" };
    }
  }
}

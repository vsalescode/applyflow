import { afterEach, describe, expect, it, vi } from "vitest";

import { OpenAIProvider } from "./openai-provider";

afterEach(() => vi.unstubAllGlobals());

describe("OpenAIProvider", () => {
  it("usa Responses API sem retenção e valida a saída estruturada", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            id: "response-1",
            model: "test-model",
            output_text: '{"value":"ok"}',
            usage: { input_tokens: 4, output_tokens: 2 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const result = await new OpenAIProvider(
      "secret",
      "test-model",
    ).generateStructured({
      messages: [{ role: "user", content: "input" }],
      maxOutputTokens: 100,
      outputSchema: {
        name: "test_output",
        jsonSchema: { type: "object" },
        parse: (value) => value as { value: string },
      },
    });
    const request = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(request).toMatchObject({
      store: false,
      model: "test-model",
      text: { format: { type: "json_schema", strict: true } },
    });
    expect(result.output).toEqual({ value: "ok" });
    expect(JSON.stringify(request)).not.toContain("secret");
  });
});

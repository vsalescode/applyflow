import { describe, expect, it } from "vitest";

import { normalizeSearchQuery } from "./query-generator";

describe("search query normalization", () => {
  it("normaliza caixa, espaços e Unicode para deduplicação", () => {
    expect(normalizeSearchQuery("  Backend   Engineer REMOTO  ")).toBe(
      "backend engineer remoto",
    );
    expect(normalizeSearchQuery("Node．js")).toBe("node.js");
  });
});

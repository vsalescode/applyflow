import { describe, expect, it } from "vitest";

import { createSessionToken, hashSessionToken } from "./session";

describe("session token", () => {
  it("gera tokens imprevisíveis e armazena um hash SHA-256", () => {
    const first = createSessionToken();
    const second = createSessionToken();
    expect(first).not.toBe(second);
    expect(hashSessionToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(first)).not.toContain(first);
  });
});

import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("gera Argon2id com salt e valida somente a senha correta", async () => {
    const first = await hashPassword("uma-senha-segura");
    const second = await hashPassword("uma-senha-segura");
    expect(first).toMatch(/^\$argon2id\$/);
    expect(first).not.toBe(second);
    await expect(verifyPassword(first, "uma-senha-segura")).resolves.toBe(true);
    await expect(verifyPassword(first, "senha-incorreta")).resolves.toBe(false);
  });
});

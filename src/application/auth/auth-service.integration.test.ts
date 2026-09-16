import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getPrismaClient } from "@/infrastructure/database/prisma";
import {
  configureOwner,
  getUserBySessionToken,
  isConfigured,
  login,
  logout,
} from "./auth-service";

describe("autenticação single-user", () => {
  const prisma = getPrismaClient();

  beforeEach(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => prisma.$disconnect());

  it("configura uma única conta e cria sessão", async () => {
    const session = await configureOwner({
      email: "OWNER@EXAMPLE.COM",
      displayName: "Owner",
      password: "senha-com-12-caracteres",
    });
    await expect(isConfigured()).resolves.toBe(true);
    await expect(getUserBySessionToken(session.token)).resolves.toMatchObject({
      email: "owner@example.com",
    });
    await expect(
      configureOwner({
        email: "other@example.com",
        password: "outra-senha-segura",
      }),
    ).rejects.toThrow();
  });

  it("autentica, rotaciona a sessão e revoga no logout", async () => {
    const initial = await configureOwner({
      email: "owner@example.com",
      password: "senha-com-12-caracteres",
    });
    const authenticated = await login(
      "owner@example.com",
      "senha-com-12-caracteres",
    );
    await expect(getUserBySessionToken(initial.token)).resolves.toBeNull();
    await expect(
      getUserBySessionToken(authenticated.token),
    ).resolves.toMatchObject({ email: "owner@example.com" });
    await logout(authenticated.token);
    await expect(
      getUserBySessionToken(authenticated.token),
    ).resolves.toBeNull();
  });

  it("rejeita credenciais inválidas", async () => {
    await configureOwner({
      email: "owner@example.com",
      password: "senha-com-12-caracteres",
    });
    await expect(
      login("owner@example.com", "senha-incorreta"),
    ).rejects.toThrow();
  });
});

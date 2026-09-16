import { describe, expect, it } from "vitest";

import { InvalidEnvironmentError, parseServerEnv } from "./env";

const validEnvironment = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://appyflow:appyflow@localhost:5432/appyflow",
};

describe("parseServerEnv", () => {
  it("aceita uma configuração válida", () => {
    expect(parseServerEnv(validEnvironment)).toEqual(validEnvironment);
  });

  it("rejeita uma URL de banco que não seja PostgreSQL", () => {
    expect(() =>
      parseServerEnv({
        ...validEnvironment,
        DATABASE_URL: "mysql://localhost/app",
      }),
    ).toThrow(InvalidEnvironmentError);
  });

  it("não inclui valores sensíveis na mensagem de erro", () => {
    const secretValue = "senha-que-nao-pode-vazar";

    try {
      parseServerEnv({ ...validEnvironment, DATABASE_URL: secretValue });
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEnvironmentError);
      expect((error as Error).message).not.toContain(secretValue);
    }
  });
});

import { describe, expect, it, vi } from "vitest";

import { createLivenessPayload, createReadinessPayload } from "./health";

const clock = () => new Date("2026-09-16T12:00:00.000Z");
const validEnvironment = {
  NODE_ENV: "test",
  APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://appyflow:appyflow@localhost:5432/appyflow",
};

describe("health checks", () => {
  it("retorna o contrato de liveness", () => {
    expect(createLivenessPayload(clock)).toEqual({
      service: "appyflow",
      status: "ok",
      timestamp: "2026-09-16T12:00:00.000Z",
    });
  });

  it("considera a aplicação pronta quando configuração e banco estão disponíveis", async () => {
    await expect(
      createReadinessPayload(validEnvironment, async () => undefined, clock),
    ).resolves.toEqual({
      payload: {
        service: "appyflow",
        status: "ok",
        timestamp: "2026-09-16T12:00:00.000Z",
        checks: {
          configuration: "ok",
          database: "ok",
          providers: "skipped",
        },
      },
      status: 200,
    });
  });

  it("retorna 503 sem consultar o banco quando a configuração é inválida", async () => {
    const probeDatabase = vi.fn(async () => undefined);

    await expect(
      createReadinessPayload({}, probeDatabase, clock),
    ).resolves.toEqual({
      payload: {
        service: "appyflow",
        status: "error",
        timestamp: "2026-09-16T12:00:00.000Z",
        checks: {
          configuration: "error",
          database: "skipped",
          providers: "skipped",
        },
      },
      status: 503,
    });
    expect(probeDatabase).not.toHaveBeenCalled();
  });

  it("retorna 503 quando o banco não está disponível", async () => {
    await expect(
      createReadinessPayload(
        validEnvironment,
        async () => {
          throw new Error("database unavailable");
        },
        clock,
      ),
    ).resolves.toEqual({
      payload: {
        service: "appyflow",
        status: "error",
        timestamp: "2026-09-16T12:00:00.000Z",
        checks: {
          configuration: "ok",
          database: "error",
          providers: "skipped",
        },
      },
      status: 503,
    });
  });

  it("retorna 503 sem consultar o banco quando um provider está incompleto", async () => {
    const probeDatabase = vi.fn(async () => undefined);

    await expect(
      createReadinessPayload(
        { ...validEnvironment, AI_PROVIDER: "openai" },
        probeDatabase,
        clock,
      ),
    ).resolves.toEqual({
      payload: {
        service: "appyflow",
        status: "error",
        timestamp: "2026-09-16T12:00:00.000Z",
        checks: {
          configuration: "ok",
          database: "skipped",
          providers: "error",
        },
      },
      status: 503,
    });
    expect(probeDatabase).not.toHaveBeenCalled();
  });

  it("indica providers configurados sem expor nomes ou credenciais", async () => {
    await expect(
      createReadinessPayload(
        {
          ...validEnvironment,
          SEARCH_PROVIDER: "serper",
          SEARCH_API_KEY: "search-secret",
        },
        async () => undefined,
        clock,
      ),
    ).resolves.toEqual({
      payload: {
        service: "appyflow",
        status: "ok",
        timestamp: "2026-09-16T12:00:00.000Z",
        checks: {
          configuration: "ok",
          database: "ok",
          providers: "ok",
        },
      },
      status: 200,
    });
  });
});

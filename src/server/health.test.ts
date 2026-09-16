import { describe, expect, it } from "vitest";

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

  it("considera a aplicação pronta quando a configuração é válida", () => {
    expect(createReadinessPayload(validEnvironment, clock)).toEqual({
      payload: {
        service: "appyflow",
        status: "ok",
        timestamp: "2026-09-16T12:00:00.000Z",
        checks: { configuration: "ok" },
      },
      status: 200,
    });
  });

  it("retorna 503 sem expor detalhes quando a configuração é inválida", () => {
    expect(createReadinessPayload({}, clock)).toEqual({
      payload: {
        service: "appyflow",
        status: "error",
        timestamp: "2026-09-16T12:00:00.000Z",
        checks: { configuration: "error" },
      },
      status: 503,
    });
  });
});

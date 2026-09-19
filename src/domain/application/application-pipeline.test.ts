import { describe, expect, it } from "vitest";

import {
  assertApplicationTransition,
  getAllowedApplicationTransitions,
  parseApplicationStatus,
} from "./application-pipeline";

describe("application pipeline", () => {
  it("permite avançar uma vaga encontrada", () => {
    expect(getAllowedApplicationTransitions("FOUND")).toContain("INTERESTING");
    expect(() => assertApplicationTransition("FOUND", "APPLIED")).not.toThrow();
  });

  it("impede pular de encontrada diretamente para oferta", () => {
    expect(() => assertApplicationTransition("FOUND", "OFFER")).toThrow(
      "não permitida",
    );
  });

  it("permite retomar uma vaga arquivada", () => {
    expect(() =>
      assertApplicationTransition("ARCHIVED", "FOUND"),
    ).not.toThrow();
  });

  it("valida valores recebidos pela API", () => {
    expect(parseApplicationStatus("INTERVIEW")).toBe("INTERVIEW");
    expect(() => parseApplicationStatus("INVALID")).toThrow("inválido");
  });
});

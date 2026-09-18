import { describe, expect, it } from "vitest";

import { parseOpportunityDashboardFilter } from "./opportunity-dashboard-service";

describe("opportunity dashboard filters", () => {
  it("aceita categoria, modalidade e busca válidas", () => {
    expect(
      parseOpportunityDashboardFilter({
        category: "HOT",
        workMode: "REMOTE",
        query: "  Backend Engineer  ",
      }),
    ).toEqual({
      category: "HOT",
      workMode: "REMOTE",
      query: "Backend Engineer",
    });
  });

  it("usa filtros seguros quando os parâmetros são inválidos", () => {
    expect(
      parseOpportunityDashboardFilter({
        category: "INVALID",
        workMode: "INVALID",
        query: 123,
      }),
    ).toEqual({ category: "ALL", workMode: "ALL", query: "" });
  });
});

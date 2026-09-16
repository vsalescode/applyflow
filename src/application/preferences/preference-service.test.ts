import { describe, expect, it } from "vitest";

import {
  InvalidPreferenceError,
  parsePreferenceInput,
} from "./preference-service";

const emptyInput = {
  desiredRoles: [],
  seniorities: [],
  workModes: [],
  locations: [],
  languages: [],
  technologies: [],
  excludedCompanies: [],
  excludedKeywords: [],
};

describe("preference input", () => {
  it("normaliza listas e remove duplicatas sem diferenciar maiúsculas", () => {
    expect(
      parsePreferenceInput({
        ...emptyInput,
        desiredRoles: [" Backend Engineer ", "backend engineer"],
        salaryMinimum: "12500,50",
        salaryCurrency: "brl",
      }),
    ).toMatchObject({
      desiredRoles: ["Backend Engineer"],
      salaryMinimum: "12500.50",
      salaryCurrency: "BRL",
    });
  });

  it("exige que salário e moeda sejam informados juntos", () => {
    expect(() =>
      parsePreferenceInput({ ...emptyInput, salaryMinimum: "10000" }),
    ).toThrow(InvalidPreferenceError);
  });
});

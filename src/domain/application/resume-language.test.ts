import { describe, expect, it } from "vitest";

import { resolveResumeLanguage } from "./resume-language";

describe("resume language", () => {
  it("detecta português e inglês por sinais determinísticos", () => {
    expect(
      resolveResumeLanguage("Vaga para desenvolvimento remoto com experiência"),
    ).toBe("PT_BR");
    expect(
      resolveResumeLanguage(
        "Remote job with development experience and requirements",
      ),
    ).toBe("EN");
  });

  it("usa preferência no caso ambíguo", () => {
    expect(resolveResumeLanguage("Backend Engineer", "AUTO", ["English"])).toBe(
      "EN",
    );
    expect(resolveResumeLanguage("Backend Engineer", "AUTO", [])).toBe("PT_BR");
  });

  it("respeita override manual", () => {
    expect(resolveResumeLanguage("English job with experience", "PT_BR")).toBe(
      "PT_BR",
    );
  });
});

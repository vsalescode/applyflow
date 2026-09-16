import { isAbsolute } from "node:path";

import { describe, expect, it } from "vitest";

import { parseStorageConfiguration } from "./storage";

describe("parseStorageConfiguration", () => {
  it("usa um diretório local fora da pasta pública por padrão", () => {
    const result = parseStorageConfiguration({});
    expect(isAbsolute(result.artifactsDirectory)).toBe(true);
    expect(result.artifactsDirectory).toMatch(/[\\/]\.data[\\/]artifacts$/);
    expect(result.artifactsDirectory).not.toMatch(/[\\/]public[\\/]/);
  });

  it("rejeita um caminho vazio", () => {
    expect(() => parseStorageConfiguration({ ARTIFACTS_DIR: " " })).toThrow(
      "Configuração de armazenamento inválida.",
    );
  });
});

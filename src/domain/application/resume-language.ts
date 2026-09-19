export type ResumeLanguage = "PT_BR" | "EN";

export function resolveResumeLanguage(
  text: string,
  override?: string | null,
  preferredLanguages: readonly string[] = [],
): ResumeLanguage {
  if (override === "PT_BR" || override === "EN") return override;
  if (override && override !== "AUTO") throw new Error("Idioma inválido.");
  const words = fold(text).split(/\s+/);
  const portuguese = count(words, [
    "de",
    "para",
    "com",
    "experiencia",
    "vaga",
    "trabalho",
    "conhecimento",
    "desenvolvimento",
    "remoto",
    "requisitos",
    "responsabilidades",
  ]);
  const english = count(words, [
    "the",
    "and",
    "with",
    "experience",
    "job",
    "work",
    "knowledge",
    "development",
    "remote",
    "requirements",
    "responsibilities",
  ]);
  if (portuguese >= 2 && portuguese > english * 1.5) return "PT_BR";
  if (english >= 2 && english > portuguese * 1.5) return "EN";
  return preferredLanguages.some((item) => /^en(?:glish)?$/i.test(item.trim()))
    ? "EN"
    : "PT_BR";
}

function count(words: string[], vocabulary: string[]) {
  const set = new Set(vocabulary);
  return words.filter((word) => set.has(word)).length;
}

function fold(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
}

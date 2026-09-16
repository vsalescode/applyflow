export type QuickFilterDecision = "ELIGIBLE" | "REVIEW" | "REJECTED";
export type QuickFilterRuleStatus = "PASS" | "REVIEW" | "REJECT";

export interface QuickFilterJob {
  title: string;
  company?: string | null;
  description?: string | null;
  location?: string | null;
  workArrangement: "UNKNOWN" | "REMOTE" | "HYBRID" | "ONSITE";
  publishedAt?: Date | null;
  discoveredAt: Date;
}

export interface QuickFilterPreferences {
  desiredRoles: readonly string[];
  seniorities: readonly string[];
  workModes: readonly ("REMOTE" | "HYBRID" | "ONSITE")[];
  locations: readonly string[];
  excludedCompanies: readonly string[];
  excludedKeywords: readonly string[];
}

export interface QuickFilterRule {
  code:
    | "COMPANY"
    | "KEYWORD"
    | "AGE"
    | "WORK_MODE"
    | "ROLE"
    | "SENIORITY"
    | "LOCATION";
  status: QuickFilterRuleStatus;
  reason: string;
}

export interface QuickFilterResult {
  decision: QuickFilterDecision;
  rules: QuickFilterRule[];
}

export interface QuickFilterOptions {
  now?: Date;
  maxAgeDays?: number;
}

const DAY_IN_MS = 24 * 60 * 60 * 1_000;

export function evaluateQuickFilters(
  job: QuickFilterJob,
  preferences: QuickFilterPreferences,
  options: QuickFilterOptions = {},
): QuickFilterResult {
  const now = options.now ?? new Date();
  const maxAgeDays = Math.max(1, Math.trunc(options.maxAgeDays ?? 45));
  const searchableText = fold(
    [job.title, job.company, job.description, job.location]
      .filter(Boolean)
      .join(" "),
  );
  const rules = [
    companyRule(job.company, preferences.excludedCompanies),
    keywordRule(searchableText, preferences.excludedKeywords),
    ageRule(job.publishedAt ?? job.discoveredAt, now, maxAgeDays),
    workModeRule(job.workArrangement, preferences.workModes),
    roleRule(job.title, preferences.desiredRoles),
    seniorityRule(job.title, preferences.seniorities),
    locationRule(job.location, preferences.locations),
  ];
  const decision = rules.some((rule) => rule.status === "REJECT")
    ? "REJECTED"
    : rules.some((rule) => rule.status === "REVIEW")
      ? "REVIEW"
      : "ELIGIBLE";

  return { decision, rules };
}

function companyRule(
  company: string | null | undefined,
  exclusions: readonly string[],
): QuickFilterRule {
  if (!exclusions.length)
    return pass("COMPANY", "nenhuma empresa bloqueada configurada");
  if (!company) return review("COMPANY", "empresa não informada pela fonte");
  const normalized = fold(company);
  const blocked = exclusions.find((item) => fold(item) === normalized);
  return blocked
    ? reject("COMPANY", `empresa bloqueada: ${blocked}`)
    : pass("COMPANY", "empresa não está bloqueada");
}

function keywordRule(
  searchableText: string,
  exclusions: readonly string[],
): QuickFilterRule {
  const blocked = exclusions.find((item) => includesTerm(searchableText, item));
  return blocked
    ? reject("KEYWORD", `palavra bloqueada encontrada: ${blocked}`)
    : pass("KEYWORD", "nenhuma palavra bloqueada encontrada");
}

function ageRule(
  referenceDate: Date,
  now: Date,
  maxAgeDays: number,
): QuickFilterRule {
  const age = Math.max(
    0,
    Math.floor((now.getTime() - referenceDate.getTime()) / DAY_IN_MS),
  );
  return age > maxAgeDays
    ? reject("AGE", `vaga tem ${age} dias; limite é ${maxAgeDays}`)
    : pass("AGE", `vaga tem ${age} dia(s)`);
}

function workModeRule(
  mode: QuickFilterJob["workArrangement"],
  accepted: QuickFilterPreferences["workModes"],
): QuickFilterRule {
  if (!accepted.length)
    return pass("WORK_MODE", "nenhuma modalidade obrigatória configurada");
  if (mode === "UNKNOWN")
    return review("WORK_MODE", "modalidade não identificada");
  return accepted.includes(mode)
    ? pass("WORK_MODE", "modalidade compatível")
    : reject("WORK_MODE", "modalidade incompatível");
}

function roleRule(title: string, roles: readonly string[]): QuickFilterRule {
  if (!roles.length) return pass("ROLE", "nenhum cargo desejado configurado");
  const normalizedTitle = fold(title);
  const matches = roles.some((role) => includesTerm(normalizedTitle, role));
  return matches
    ? pass("ROLE", "cargo desejado encontrado no título")
    : review("ROLE", "título não corresponde claramente aos cargos desejados");
}

function seniorityRule(
  title: string,
  accepted: readonly string[],
): QuickFilterRule {
  if (!accepted.length)
    return pass("SENIORITY", "nenhuma senioridade obrigatória configurada");
  const seniority = inferSeniority(title);
  if (!seniority)
    return review("SENIORITY", "senioridade não identificada no título");
  return accepted.includes(seniority)
    ? pass("SENIORITY", "senioridade compatível")
    : reject("SENIORITY", `senioridade incompatível: ${seniority}`);
}

function locationRule(
  location: string | null | undefined,
  accepted: readonly string[],
): QuickFilterRule {
  if (!accepted.length)
    return pass("LOCATION", "nenhuma localização obrigatória configurada");
  if (!location)
    return review("LOCATION", "localização não informada pela fonte");
  const normalized = fold(location);
  const matches = accepted.some((item) => includesTerm(normalized, item));
  return matches
    ? pass("LOCATION", "localização compatível")
    : review(
        "LOCATION",
        "localização não corresponde claramente às preferências",
      );
}

function inferSeniority(title: string) {
  const value = fold(title);
  const patterns: Array<[RegExp, string]> = [
    [/\b(executive|diretor|director|head|vp)\b/, "EXECUTIVE"],
    [/\b(manager|gerente)\b/, "MANAGER"],
    [/\b(lead|lider|principal|staff)\b/, "LEAD"],
    [/\b(senior|sr)\b/, "SENIOR"],
    [/\b(pleno|mid level|midlevel)\b/, "MID_LEVEL"],
    [/\b(junior|jr)\b/, "JUNIOR"],
    [/\b(estagio|estagiario|intern|internship)\b/, "INTERN"],
  ];
  return patterns.find(([pattern]) => pattern.test(value))?.[1];
}

function includesTerm(normalizedText: string, term: string) {
  const normalizedTerm = fold(term);
  return (
    Boolean(normalizedTerm) &&
    ` ${normalizedText} `.includes(` ${normalizedTerm} `)
  );
}

function fold(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim();
}

function pass(code: QuickFilterRule["code"], reason: string): QuickFilterRule {
  return { code, status: "PASS", reason };
}

function review(
  code: QuickFilterRule["code"],
  reason: string,
): QuickFilterRule {
  return { code, status: "REVIEW", reason };
}

function reject(
  code: QuickFilterRule["code"],
  reason: string,
): QuickFilterRule {
  return { code, status: "REJECT", reason };
}

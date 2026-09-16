export interface SourceMetricPoint {
  uniqueJobCount: number;
  observedAt: Date;
}

export interface SourceScoreInput {
  occurrenceCount: number;
  uniqueJobCount: number;
  lastSeenAt: Date;
  metricHistory: readonly SourceMetricPoint[];
}

export interface SourceScoreBreakdown {
  volume: number;
  uniqueness: number;
  freshness: number;
  momentum: number;
}

export type SourceScoreLevel = "HIGH" | "MEDIUM" | "LOW";

export interface SourceScore {
  value: number;
  level: SourceScoreLevel;
  breakdown: SourceScoreBreakdown;
  reasons: string[];
}

const DAY_IN_MS = 24 * 60 * 60 * 1_000;

export function calculateSourceScore(
  input: SourceScoreInput,
  now: Date = new Date(),
): SourceScore {
  const occurrences = nonNegative(input.occurrenceCount);
  const uniqueJobs = Math.min(nonNegative(input.uniqueJobCount), occurrences);
  const volume = roundedPoints((Math.min(uniqueJobs, 20) / 20) * 30);
  const uniquenessRatio = occurrences === 0 ? 0 : uniqueJobs / occurrences;
  const uniqueness = roundedPoints(uniquenessRatio * 25);
  const ageInDays = Math.max(
    0,
    (now.getTime() - input.lastSeenAt.getTime()) / DAY_IN_MS,
  );
  const freshness = freshnessPoints(ageInDays);
  const history = [...input.metricHistory].sort(
    (left, right) => left.observedAt.getTime() - right.observedAt.getTime(),
  );
  const growth =
    history.length < 2
      ? null
      : Math.max(
          0,
          nonNegative(history.at(-1)?.uniqueJobCount ?? 0) -
            nonNegative(history[0]?.uniqueJobCount ?? 0),
        );
  const momentum =
    growth === null ? 0 : roundedPoints((Math.min(growth, 10) / 10) * 20);
  const breakdown = { volume, uniqueness, freshness, momentum };
  const value = Object.values(breakdown).reduce(
    (total, component) => total + component,
    0,
  );

  return {
    value,
    level: value >= 70 ? "HIGH" : value >= 40 ? "MEDIUM" : "LOW",
    breakdown,
    reasons: [
      `${uniqueJobs} vaga(s) única(s) observada(s)`,
      uniquenessReason(uniquenessRatio, occurrences),
      freshnessReason(ageInDays),
      growth === null
        ? "histórico insuficiente para medir crescimento"
        : `${growth} nova(s) vaga(s) única(s) no histórico observado`,
    ],
  };
}

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function roundedPoints(value: number) {
  return Math.round(value);
}

function freshnessPoints(ageInDays: number) {
  if (ageInDays <= 1) return 25;
  if (ageInDays <= 7) return 20;
  if (ageInDays <= 30) return 12;
  if (ageInDays <= 90) return 5;
  return 0;
}

function uniquenessReason(ratio: number, occurrences: number) {
  if (occurrences === 0) return "nenhuma ocorrência para avaliar duplicação";
  const percentage = Math.round(ratio * 100);
  return `${percentage}% das ocorrências representam vagas únicas`;
}

function freshnessReason(ageInDays: number) {
  if (ageInDays <= 1) return "fonte observada no ultimo dia";
  if (ageInDays <= 7) return "fonte observada na ultima semana";
  if (ageInDays <= 30) return "fonte observada no ultimo mes";
  if (ageInDays <= 90) return "fonte sem observação recente";
  return "fonte inativa há mais de 90 dias";
}

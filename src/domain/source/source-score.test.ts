import { describe, expect, it } from "vitest";

import { calculateSourceScore } from "./source-score";

const now = new Date("2026-09-16T12:00:00.000Z");

describe("source score", () => {
  it("atribui pontuacao alta a uma fonte recente, diversa e em crescimento", () => {
    const score = calculateSourceScore(
      {
        occurrenceCount: 20,
        uniqueJobCount: 18,
        lastSeenAt: new Date("2026-09-16T08:00:00.000Z"),
        metricHistory: [
          {
            uniqueJobCount: 8,
            observedAt: new Date("2026-09-01T12:00:00.000Z"),
          },
          {
            uniqueJobCount: 18,
            observedAt: new Date("2026-09-16T08:00:00.000Z"),
          },
        ],
      },
      now,
    );

    expect(score).toEqual({
      value: 95,
      level: "HIGH",
      breakdown: { volume: 27, uniqueness: 23, freshness: 25, momentum: 20 },
      reasons: [
        "18 vaga(s) única(s) observada(s)",
        "90% das ocorrências representam vagas únicas",
        "fonte observada no ultimo dia",
        "10 nova(s) vaga(s) única(s) no histórico observado",
      ],
    });
  });

  it("penaliza duplicacao, inatividade e ausencia de crescimento", () => {
    const score = calculateSourceScore(
      {
        occurrenceCount: 20,
        uniqueJobCount: 2,
        lastSeenAt: new Date("2026-05-01T12:00:00.000Z"),
        metricHistory: [
          {
            uniqueJobCount: 2,
            observedAt: new Date("2026-04-01T12:00:00.000Z"),
          },
          {
            uniqueJobCount: 2,
            observedAt: new Date("2026-05-01T12:00:00.000Z"),
          },
        ],
      },
      now,
    );

    expect(score.value).toBe(6);
    expect(score.level).toBe("LOW");
    expect(score.breakdown).toEqual({
      volume: 3,
      uniqueness: 3,
      freshness: 0,
      momentum: 0,
    });
  });

  it("nao inventa crescimento quando existe somente um snapshot", () => {
    const score = calculateSourceScore(
      {
        occurrenceCount: 1,
        uniqueJobCount: 1,
        lastSeenAt: now,
        metricHistory: [{ uniqueJobCount: 1, observedAt: now }],
      },
      now,
    );

    expect(score.value).toBe(52);
    expect(score.breakdown.momentum).toBe(0);
    expect(score.reasons).toContain(
      "histórico insuficiente para medir crescimento",
    );
  });

  it("limita contagens inconsistentes e datas futuras", () => {
    const score = calculateSourceScore(
      {
        occurrenceCount: 3,
        uniqueJobCount: 10,
        lastSeenAt: new Date("2026-09-17T12:00:00.000Z"),
        metricHistory: [],
      },
      now,
    );

    expect(score.breakdown).toEqual({
      volume: 5,
      uniqueness: 25,
      freshness: 25,
      momentum: 0,
    });
    expect(score.value).toBe(55);
  });
});

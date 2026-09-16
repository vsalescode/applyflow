import Link from "next/link";

import { getUserBySessionToken } from "@/application/auth/auth-service";
import { listDiscoveredSources } from "@/application/search/source-service";
import { readSessionCookie } from "@/infrastructure/auth/cookie";

export const dynamic = "force-dynamic";

const sourceKinds = {
  UNKNOWN: "Não classificada",
  ATS: "ATS",
  CAREER_PAGE: "Página de carreiras",
  AGGREGATOR: "Agregador",
  SPECIALIZED_PORTAL: "Portal especializado",
} as const;

const scoreLevels = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
} as const;

export default async function SourcesPage() {
  const user = await getUserBySessionToken(await readSessionCookie());
  const sources = user ? await listDiscoveredSources(user.id) : [];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Link className="text-sm font-medium text-emerald-700" href="/dashboard">
        ← Voltar ao dashboard
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Fontes descobertas</h1>
      <p className="mt-2 text-slate-600">
        Domínios encontrados durante a normalização e suas métricas observadas.
      </p>

      {!sources.length ? (
        <p className="mt-8 text-slate-600">Nenhuma fonte descoberta.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {sources.map((source) => (
            <li className="rounded-2xl border bg-white p-5" key={source.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{source.domain}</h2>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                      {source.score.value}/100 ·{" "}
                      {scoreLevels[source.score.level]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {source.provider} · {sourceKinds[source.kind]}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  Última observação: {source.lastSeenAt.toLocaleString("pt-BR")}
                </p>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <Metric label="Ocorrências" value={source.occurrenceCount} />
                <Metric label="Vagas únicas" value={source.uniqueJobCount} />
                <Metric label="Snapshots" value={source.metricHistory.length} />
              </dl>
              <details className="mt-4 text-sm text-slate-600">
                <summary className="cursor-pointer font-medium text-slate-800">
                  Como a pontuação foi calculada
                </summary>
                <dl className="mt-3 grid gap-2 sm:grid-cols-4">
                  <Metric
                    label="Volume"
                    value={source.score.breakdown.volume}
                  />
                  <Metric
                    label="Baixa duplicação"
                    value={source.score.breakdown.uniqueness}
                  />
                  <Metric
                    label="Recência"
                    value={source.score.breakdown.freshness}
                  />
                  <Metric
                    label="Crescimento"
                    value={source.score.breakdown.momentum}
                  />
                </dl>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {source.score.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

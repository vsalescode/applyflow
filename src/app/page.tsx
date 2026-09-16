const foundations = [
  "Instalação privada e single-user",
  "Provedores configurados com suas próprias chaves",
  "Currículos rastreáveis em português e inglês",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-10">
      <div className="max-w-3xl">
        <p className="mb-5 text-sm font-semibold tracking-[0.2em] text-emerald-700 uppercase">
          Open source · Self-hosted
        </p>
        <h1 className="text-5xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-6xl">
          Encontre oportunidades melhores. Prepare candidaturas com contexto.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
          O AppyFlow transforma seu perfil profissional em pesquisas relevantes,
          análises explicáveis e currículos adaptados sem inventar experiências.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-3">
        {foundations.map((foundation) => (
          <li
            className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 font-medium text-slate-700 shadow-sm"
            key={foundation}
          >
            {foundation}
          </li>
        ))}
      </ul>

      <p className="mt-12 text-sm text-slate-500">
        Fundação técnica pronta. As funcionalidades serão entregues de forma
        incremental.
      </p>
    </main>
  );
}

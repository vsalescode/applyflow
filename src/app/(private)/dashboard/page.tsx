import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">AppyFlow</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="rounded-lg border px-4 py-2" type="submit">
            Sair
          </button>
        </form>
      </div>
      <p className="mt-12 text-slate-600">
        Sua instalação está protegida e pronta para receber o perfil
        profissional.
      </p>
      <Link
        className="mt-6 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        href="/curriculos"
      >
        Enviar currículo mestre
      </Link>
      <Link
        className="mt-6 ml-3 inline-flex rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold"
        href="/perfil"
      >
        Editar perfil profissional
      </Link>
    </main>
  );
}

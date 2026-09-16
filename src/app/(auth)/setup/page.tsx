import { redirect } from "next/navigation";

import { isConfigured } from "@/application/auth/auth-service";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isConfigured()) redirect("/login");
  const query = await searchParams;
  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold">Configurar instalação</h1>
      <p className="mt-2 text-slate-600">
        Crie o único usuário desta instalação.
      </p>
      {query.erro && (
        <p className="mt-4 text-sm text-red-700">
          Verifique os dados. A senha deve ter ao menos 12 caracteres.
        </p>
      )}
      <form action="/api/auth/setup" method="post" className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Nome
          <input
            className="mt-1 w-full rounded-lg border p-3"
            name="displayName"
            maxLength={120}
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded-lg border p-3"
            name="email"
            type="email"
            required
            maxLength={320}
          />
        </label>
        <label className="block text-sm font-medium">
          Senha
          <input
            className="mt-1 w-full rounded-lg border p-3"
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>
        <button
          className="w-full rounded-lg bg-emerald-700 p-3 font-semibold text-white"
          type="submit"
        >
          Criar usuário
        </button>
      </form>
    </section>
  );
}

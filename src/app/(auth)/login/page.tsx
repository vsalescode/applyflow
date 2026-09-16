import { redirect } from "next/navigation";

import {
  getUserBySessionToken,
  isConfigured,
} from "@/application/auth/auth-service";
import { readSessionCookie } from "@/infrastructure/auth/cookie";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isConfigured())) redirect("/setup");
  if (await getUserBySessionToken(await readSessionCookie()))
    redirect("/dashboard");
  const query = await searchParams;
  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold">Entrar</h1>
      {query.erro && (
        <p className="mt-4 text-sm text-red-700">Email ou senha inválidos.</p>
      )}
      <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded-lg border p-3"
            name="email"
            type="email"
            required
            autoComplete="username"
          />
        </label>
        <label className="block text-sm font-medium">
          Senha
          <input
            className="mt-1 w-full rounded-lg border p-3"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button
          className="w-full rounded-lg bg-emerald-700 p-3 font-semibold text-white"
          type="submit"
        >
          Entrar
        </button>
      </form>
    </section>
  );
}

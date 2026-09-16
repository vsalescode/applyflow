import Link from "next/link";

import { getUserBySessionToken } from "@/application/auth/auth-service";
import { getPreference } from "@/application/preferences/preference-service";
import { readSessionCookie } from "@/infrastructure/auth/cookie";

export const dynamic = "force-dynamic";

const seniorities = [
  ["INTERN", "Estágio"],
  ["JUNIOR", "Júnior"],
  ["MID_LEVEL", "Pleno"],
  ["SENIOR", "Sênior"],
  ["LEAD", "Liderança técnica"],
  ["MANAGER", "Gestão"],
  ["EXECUTIVE", "Executiva"],
] as const;
const workModes = [
  ["REMOTE", "Remoto"],
  ["HYBRID", "Híbrido"],
  ["ONSITE", "Presencial"],
] as const;
const asLines = (items: string[] | undefined) => items?.join("\n") ?? "";

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUserBySessionToken(await readSessionCookie());
  const preference = user ? await getPreference(user.id) : null;
  const query = await searchParams;
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <Link className="text-sm font-medium text-emerald-700" href="/dashboard">
        ← Voltar ao dashboard
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">
        Preferências profissionais
      </h1>
      <p className="mt-2 text-slate-600">
        Campos vazios não eliminam vagas. Informe somente critérios relevantes
        para você.
      </p>
      {query.sucesso ? (
        <p className="mt-5 text-sm text-emerald-700">Preferências salvas.</p>
      ) : null}
      {query.erro ? (
        <p className="mt-5 text-sm text-red-700">
          Revise os campos. Salário e moeda devem ser informados juntos.
        </p>
      ) : null}
      <form
        action="/api/preferences"
        className="mt-8 grid gap-6 rounded-2xl border bg-white p-6 sm:grid-cols-2"
        method="post"
      >
        <ListField
          defaultValue={asLines(preference?.desiredRoles)}
          label="Cargos desejados"
          name="desiredRoles"
          placeholder={"Backend Engineer\nSoftware Engineer"}
        />
        <ListField
          defaultValue={asLines(preference?.locations)}
          label="Localizações aceitas"
          name="locations"
          placeholder={"Brasil\nSão Paulo, SP"}
        />
        <fieldset>
          <legend className="text-sm font-medium">Senioridades</legend>
          <div className="mt-3 grid gap-2">
            {seniorities.map(([value, label]) => (
              <Check
                defaultChecked={preference?.seniorities.includes(value)}
                key={value}
                label={label}
                name="seniorities"
                value={value}
              />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Modalidades</legend>
          <div className="mt-3 grid gap-2">
            {workModes.map(([value, label]) => (
              <Check
                defaultChecked={preference?.workModes.includes(value)}
                key={value}
                label={label}
                name="workModes"
                value={value}
              />
            ))}
          </div>
        </fieldset>
        <ListField
          defaultValue={asLines(preference?.languages)}
          label="Idiomas"
          name="languages"
          placeholder={"Português\nInglês"}
        />
        <ListField
          defaultValue={asLines(preference?.technologies)}
          label="Tecnologias desejadas"
          name="technologies"
          placeholder={"TypeScript\nPostgreSQL"}
        />
        <label className="text-sm font-medium">
          Salário mínimo
          <input
            className="mt-2 block w-full rounded-lg border p-3"
            defaultValue={preference?.salaryMinimum?.toString() ?? ""}
            inputMode="decimal"
            name="salaryMinimum"
            placeholder="12000,00"
          />
        </label>
        <label className="text-sm font-medium">
          Moeda
          <input
            className="mt-2 block w-full rounded-lg border p-3 uppercase"
            defaultValue={preference?.salaryCurrency ?? ""}
            maxLength={3}
            name="salaryCurrency"
            placeholder="BRL"
          />
        </label>
        <ListField
          defaultValue={asLines(preference?.excludedCompanies)}
          label="Empresas excluídas"
          name="excludedCompanies"
          placeholder="Uma empresa por linha"
        />
        <ListField
          defaultValue={asLines(preference?.excludedKeywords)}
          label="Termos excluídos"
          name="excludedKeywords"
          placeholder={"voluntário\nnão remunerado"}
        />
        <button
          className="w-fit rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:col-span-2"
          type="submit"
        >
          Salvar preferências
        </button>
      </form>
    </main>
  );
}

function ListField({
  defaultValue,
  label,
  name,
  placeholder,
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <textarea
        className="mt-2 block min-h-28 w-full rounded-lg border p-3"
        defaultValue={defaultValue}
        maxLength={6000}
        name={name}
        placeholder={placeholder}
      />
      <span className="mt-1 block text-xs font-normal text-slate-500">
        Um item por linha.
      </span>
    </label>
  );
}

function Check({
  defaultChecked,
  label,
  name,
  value,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value={value}
      />
      {label}
    </label>
  );
}

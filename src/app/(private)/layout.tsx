import { redirect } from "next/navigation";

import { getUserBySessionToken } from "@/application/auth/auth-service";
import { readSessionCookie } from "@/infrastructure/auth/cookie";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getUserBySessionToken(await readSessionCookie())))
    redirect("/login");
  return children;
}

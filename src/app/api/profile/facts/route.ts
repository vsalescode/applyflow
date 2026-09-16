import { NextResponse } from "next/server";

import { addProfessionalFact } from "@/application/profile/profile-service";
import { getUserBySessionToken } from "@/application/auth/auth-service";
import { readSessionCookie } from "@/infrastructure/auth/cookie";
import { hasTrustedOrigin } from "@/infrastructure/auth/origin";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return new Response(null, { status: 403 });
  const user = await getUserBySessionToken(await readSessionCookie());
  if (!user) return new Response(null, { status: 401 });
  try {
    await addProfessionalFact(
      user.id,
      Object.fromEntries(await request.formData()),
    );
    return NextResponse.redirect(
      new URL("/perfil?sucesso=fato", request.url),
      303,
    );
  } catch {
    return NextResponse.redirect(
      new URL("/perfil?erro=fato", request.url),
      303,
    );
  }
}

import { NextResponse } from "next/server";

import { login } from "@/application/auth/auth-service";
import { setSessionCookie } from "@/infrastructure/auth/cookie";
import { hasTrustedOrigin } from "@/infrastructure/auth/origin";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return new Response(null, { status: 403 });
  const form = await request.formData();
  try {
    const session = await login(
      String(form.get("email") ?? ""),
      String(form.get("password") ?? ""),
    );
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  } catch {
    return NextResponse.redirect(
      new URL("/login?erro=credenciais", request.url),
      303,
    );
  }
}

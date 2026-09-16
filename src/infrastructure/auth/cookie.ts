import { cookies } from "next/headers";

import { sessionDurationMs } from "@/domain/auth/session";

export const sessionCookieName =
  process.env.NODE_ENV === "production" ? "__Host-id" : "appyflow-id";

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: Math.floor(sessionDurationMs / 1000),
  });
}

export async function readSessionCookie() {
  return (await cookies()).get(sessionCookieName)?.value;
}

export async function clearSessionCookie() {
  (await cookies()).delete(sessionCookieName);
}

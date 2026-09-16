import { parseServerEnv } from "@/server/config/env";

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(parseServerEnv(process.env).APP_URL).origin;
}

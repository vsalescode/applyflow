import { createLivenessPayload } from "@/server/health";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(createLivenessPayload(), {
    headers: { "Cache-Control": "no-store" },
  });
}

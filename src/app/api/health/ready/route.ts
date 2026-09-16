import { createReadinessPayload } from "@/server/health";

export const dynamic = "force-dynamic";

export function GET() {
  const result = createReadinessPayload(process.env);

  return Response.json(result.payload, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}

import { checkDatabaseConnection } from "@/infrastructure/database/prisma";
import { createReadinessPayload } from "@/server/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await createReadinessPayload(
    process.env,
    checkDatabaseConnection,
  );

  return Response.json(result.payload, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}

import { getUserBySessionToken } from "@/application/auth/auth-service";
import { analyzeJobMatchWithAI } from "@/application/search/ai-matching-service";
import { readSessionCookie } from "@/infrastructure/auth/cookie";
import { hasTrustedOrigin } from "@/infrastructure/auth/origin";
import { getAIProvider } from "@/infrastructure/providers/ai-provider-factory";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasTrustedOrigin(request)) return new Response(null, { status: 403 });
  const user = await getUserBySessionToken(await readSessionCookie());
  if (!user) return new Response(null, { status: 401 });
  const provider = getAIProvider();
  if (!provider)
    return Response.json({ error: "AI disabled" }, { status: 503 });
  try {
    const result = await analyzeJobMatchWithAI(
      user.id,
      (await params).id,
      provider,
    );
    return Response.json(result);
  } catch {
    return Response.json({ error: "Analysis failed" }, { status: 422 });
  }
}

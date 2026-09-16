import { readMasterResumeArtifact } from "@/application/resume/master-resume-service";
import { getUserBySessionToken } from "@/application/auth/auth-service";
import { readSessionCookie } from "@/infrastructure/auth/cookie";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserBySessionToken(await readSessionCookie());
  if (!user) return new Response(null, { status: 401 });
  const artifact = await readMasterResumeArtifact(user.id, (await params).id);
  if (!artifact) return new Response(null, { status: 404 });

  const encodedName = encodeURIComponent(artifact.resume.originalName);
  const responseBytes = new Uint8Array(artifact.bytes.byteLength);
  responseBytes.set(artifact.bytes);
  return new Response(responseBytes, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="curriculo.pdf"; filename*=UTF-8''${encodedName}`,
      "Content-Length": String(artifact.bytes.byteLength),
      "Content-Type": artifact.resume.mediaType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { randomUUID } from "node:crypto";

import type { ResumeTextExtractor } from "./resume-text-extractor";
import type { ArtifactStorage } from "@/application/storage/artifact-storage";
import {
  validateResumeUpload,
  type ResumeUpload,
} from "@/domain/resume/resume-file";
import { PdfTextExtractor } from "@/infrastructure/resume/pdf-text-extractor";
import { getPrismaClient } from "@/infrastructure/database/prisma";
import { getArtifactStorage } from "@/infrastructure/storage";

interface ResumeDependencies {
  storage: ArtifactStorage;
  extractor: ResumeTextExtractor;
}

function defaultDependencies(): ResumeDependencies {
  return {
    storage: getArtifactStorage(),
    extractor: new PdfTextExtractor(),
  };
}

export async function uploadMasterResume(
  userId: string,
  upload: ResumeUpload,
  dependencies: ResumeDependencies = defaultDependencies(),
) {
  const metadata = validateResumeUpload(upload);
  const extracted = await dependencies.extractor.extract(upload.bytes);
  const storageKey = `${randomUUID()}.pdf`;

  await dependencies.storage.write(storageKey, upload.bytes);
  try {
    return await getPrismaClient().$transaction(async (transaction) => {
      await transaction.resume.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      return transaction.resume.create({
        data: {
          id: randomUUID(),
          userId,
          storageKey,
          extractedText: extracted.text,
          pageCount: extracted.pageCount,
          ...metadata,
        },
      });
    });
  } catch (error) {
    await dependencies.storage.remove(storageKey);
    throw error;
  }
}

export function listMasterResumes(userId: string) {
  return getPrismaClient().resume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function readMasterResumeArtifact(
  userId: string,
  resumeId: string,
  storage: ArtifactStorage = getArtifactStorage(),
) {
  const resume = await getPrismaClient().resume.findFirst({
    where: { id: resumeId, userId },
  });
  if (!resume) return null;
  return { resume, bytes: await storage.read(resume.storageKey) };
}

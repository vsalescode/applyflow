import { randomUUID } from "node:crypto";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { uploadMasterResume } from "./master-resume-service";
import type { ResumeTextExtractor } from "./resume-text-extractor";
import type { ArtifactStorage } from "@/application/storage/artifact-storage";
import { pdfMediaType } from "@/domain/resume/resume-file";
import { getPrismaClient } from "@/infrastructure/database/prisma";

class MemoryStorage implements ArtifactStorage {
  readonly artifacts = new Map<string, Uint8Array>();
  readonly remove = vi.fn(async (key: string) => {
    this.artifacts.delete(key);
  });

  async write(key: string, bytes: Uint8Array) {
    this.artifacts.set(key, bytes);
  }

  async read(key: string) {
    const bytes = this.artifacts.get(key);
    if (!bytes) throw new Error("not found");
    return bytes;
  }
}

const extractor: ResumeTextExtractor = {
  extract: async () => ({ text: "Texto do currículo", pageCount: 1 }),
};
const pdfBytes = new TextEncoder().encode("%PDF-1.7\ntest");
const prisma = getPrismaClient();

beforeEach(async () => {
  await prisma.resume.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createUser() {
  return prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${randomUUID()}@example.com`,
      passwordHash: "not-used-in-this-test",
    },
  });
}

describe("master resume service", () => {
  it("preserva o histórico e mantém somente o envio mais recente ativo", async () => {
    const user = await createUser();
    const storage = new MemoryStorage();
    const dependencies = { storage, extractor };

    const first = await uploadMasterResume(
      user.id,
      { name: "primeiro.pdf", type: pdfMediaType, bytes: pdfBytes },
      dependencies,
    );
    const second = await uploadMasterResume(
      user.id,
      { name: "segundo.pdf", type: pdfMediaType, bytes: pdfBytes },
      dependencies,
    );

    expect(storage.artifacts.size).toBe(2);
    await expect(
      prisma.resume.findUnique({ where: { id: first.id } }),
    ).resolves.toMatchObject({
      isActive: false,
    });
    await expect(
      prisma.resume.findUnique({ where: { id: second.id } }),
    ).resolves.toMatchObject({
      isActive: true,
      extractedText: "Texto do currículo",
    });
  });

  it("remove o arquivo quando a persistência falha", async () => {
    const storage = new MemoryStorage();
    await expect(
      uploadMasterResume(
        randomUUID(),
        { name: "curriculo.pdf", type: pdfMediaType, bytes: pdfBytes },
        { storage, extractor },
      ),
    ).rejects.toThrow();
    expect(storage.artifacts.size).toBe(0);
    expect(storage.remove).toHaveBeenCalledOnce();
  });
});

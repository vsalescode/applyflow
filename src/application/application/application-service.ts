import { randomUUID } from "node:crypto";

import {
  assertApplicationTransition,
  parseApplicationStatus,
} from "@/domain/application/application-pipeline";
import { getPrismaClient } from "@/infrastructure/database/prisma";

export async function updateApplicationStatus(
  userId: string,
  jobId: string,
  value: unknown,
  clock: () => Date = () => new Date(),
) {
  const target = parseApplicationStatus(value);
  const prisma = getPrismaClient();
  const job = await prisma.job.findFirst({
    where: { id: jobId, profile: { userId } },
    include: { application: true },
  });
  if (!job) throw new Error("Vaga não encontrada.");
  const current = job.application?.status ?? "FOUND";
  if (current === target) return job.application;
  assertApplicationTransition(current, target);
  const changedAt = clock();

  return prisma.$transaction(async (transaction) => {
    const application = job.application
      ? await transaction.application.update({
          where: { id: job.application.id },
          data: { status: target },
        })
      : await transaction.application.create({
          data: { id: randomUUID(), jobId, status: target },
        });
    await transaction.applicationStatusEvent.create({
      data: {
        id: randomUUID(),
        applicationId: application.id,
        fromStatus: current,
        toStatus: target,
        changedAt,
      },
    });
    return application;
  });
}

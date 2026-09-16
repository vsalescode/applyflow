import { randomUUID } from "node:crypto";

import { getPrismaClient } from "@/infrastructure/database/prisma";
import { hashPassword, verifyPassword } from "@/domain/auth/password";
import {
  createSessionToken,
  hashSessionToken,
  sessionDurationMs,
} from "@/domain/auth/session";

export class AuthenticationError extends Error {}
export class InstallationAlreadyConfiguredError extends Error {}

type OwnerInput = { email: string; displayName?: string; password: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertCredentials(input: OwnerInput) {
  const email = normalizeEmail(input.email);
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 320)
    throw new AuthenticationError();
  if (input.password.length < 12 || input.password.length > 128)
    throw new AuthenticationError();
  return {
    ...input,
    email,
    displayName: input.displayName?.trim() || undefined,
  };
}

async function issueSession(userId: string) {
  const prisma = getPrismaClient();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await prisma.session.create({
    data: {
      id: randomUUID(),
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function isConfigured() {
  return (await getPrismaClient().user.count()) > 0;
}

export async function configureOwner(input: OwnerInput) {
  const data = assertCredentials(input);
  const prisma = getPrismaClient();
  if ((await prisma.user.count()) > 0)
    throw new InstallationAlreadyConfiguredError();
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: data.email,
      displayName: data.displayName,
      passwordHash: await hashPassword(data.password),
    },
  });
  return issueSession(user.id);
}

export async function login(email: string, password: string) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!user || !(await verifyPassword(user.passwordHash, password)))
    throw new AuthenticationError();
  await prisma.session.deleteMany({
    where: { OR: [{ userId: user.id }, { expiresAt: { lte: new Date() } }] },
  });
  return issueSession(user.id);
}

export async function getUserBySessionToken(token?: string) {
  if (!token) return null;
  const session = await getPrismaClient().session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session)
      await getPrismaClient().session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

export async function logout(token?: string) {
  if (token)
    await getPrismaClient().session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
}

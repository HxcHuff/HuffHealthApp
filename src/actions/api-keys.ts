"use server";

import { randomBytes, createHash } from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { CreateApiKeySchema } from "@/lib/validations/api-key";
import { revalidatePath } from "next/cache";

export async function generateApiKey(name: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const validated = CreateApiKeySchema.safeParse({ name });
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors.name?.[0] || "Invalid name" };
  }

  try {
    const rawKey = "hh_" + randomBytes(20).toString("hex");
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const encryptedKey = encrypt(rawKey);
    const prefix = rawKey.slice(0, 8);

    await db.apiKey.create({
      data: {
        name: validated.data.name,
        keyHash,
        encryptedKey,
        prefix,
        createdById: session.user.id,
      },
    });

    revalidatePath("/settings/api-keys");
    revalidatePath("/integrations");
    return { success: true, key: rawKey };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate API key";
    return { error: message };
  }
}

export async function getApiKeys() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return [];
  }

  return db.apiKey.findMany({
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true,
      isRevoked: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeApiKey(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  await db.apiKey.update({
    where: { id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  });

  await db.leadSource.updateMany({
    where: { apiKeyId: id },
    data: { apiKeyId: null },
  });

  revalidatePath("/settings/api-keys");
  revalidatePath("/integrations");
  return { success: true };
}

export async function getLeadSourceApiKeyMappings() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return [];
  }

  return db.leadSource.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      apiKeyId: true,
      apiKey: {
        select: {
          id: true,
          name: true,
          prefix: true,
          isRevoked: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function assignApiKeyToLeadSource(sourceId: string, apiKeyId: string | null) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (apiKeyId) {
    const apiKey = await db.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { id: true, isRevoked: true },
    });
    if (!apiKey || apiKey.isRevoked) {
      return { error: "Invalid API key selection" };
    }
  }

  await db.leadSource.update({
    where: { id: sourceId },
    data: { apiKeyId },
  });

  revalidatePath("/integrations");
  revalidatePath("/settings/sources");
  return { success: true };
}

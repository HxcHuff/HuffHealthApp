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
  return { success: true, key: rawKey };
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

  revalidatePath("/settings/api-keys");
  return { success: true };
}

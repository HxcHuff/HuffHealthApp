"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { WalletTransactionSchema } from "@/lib/validations/api-wallet";
import { revalidatePath } from "next/cache";

export async function getWalletBalance() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { balance: 0, currency: "credits" };
  }

  const wallet = await db.apiWallet.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", balance: 0 },
  });

  return { balance: wallet.balance, currency: wallet.currency };
}

export async function addCredits(amount: number, description: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const validated = WalletTransactionSchema.safeParse({ amount, description });
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  await db.$transaction([
    db.apiWallet.upsert({
      where: { id: "default" },
      update: { balance: { increment: validated.data.amount } },
      create: { id: "default", balance: validated.data.amount },
    }),
    db.apiWalletTransaction.create({
      data: {
        amount: validated.data.amount,
        type: "CREDIT",
        description: validated.data.description,
        performedById: session.user.id,
      },
    }),
  ]);

  revalidatePath("/settings/api-wallet");
  return { success: true };
}

export async function deductCredits(amount: number, description: string, reference?: string) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const validated = WalletTransactionSchema.safeParse({ amount, description });
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const wallet = await db.apiWallet.findUnique({ where: { id: "default" } });
  if (!wallet || wallet.balance < validated.data.amount) {
    return { error: "Insufficient balance" };
  }

  await db.$transaction([
    db.apiWallet.update({
      where: { id: "default" },
      data: { balance: { decrement: validated.data.amount } },
    }),
    db.apiWalletTransaction.create({
      data: {
        amount: -validated.data.amount,
        type: "DEBIT",
        description: validated.data.description,
        reference: reference || null,
        performedById: session.user.id,
      },
    }),
  ]);

  revalidatePath("/settings/api-wallet");
  return { success: true };
}

export async function getWalletTransactions(page = 1, limit = 20) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return { transactions: [], total: 0, page: 1, totalPages: 0 };
  }

  const [transactions, total] = await Promise.all([
    db.apiWalletTransaction.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        performedBy: { select: { id: true, name: true } },
      },
    }),
    db.apiWalletTransaction.count(),
  ]);

  return {
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

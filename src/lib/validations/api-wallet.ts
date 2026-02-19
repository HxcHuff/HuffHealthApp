import { z } from "zod";

export const WalletTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
});

export type WalletTransactionInput = z.infer<typeof WalletTransactionSchema>;

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCredits, deductCredits } from "@/actions/api-wallet";
import { formatRelativeTime } from "@/lib/utils";
import { Wallet, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  reference: string | null;
  createdAt: string | Date;
  performedBy: { id: string; name: string };
}

interface ApiWalletManagerProps {
  balance: number;
  currency: string;
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

export function ApiWalletManager({ balance, currency, transactions, total, page, totalPages }: ApiWalletManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "add" | "deduct">("idle");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Enter a valid positive amount");
      return;
    }

    const result = mode === "add"
      ? await addCredits(numAmount, description)
      : await deductCredits(numAmount, description);

    if (result.error) {
      setError(typeof result.error === "string" ? result.error : "Validation failed");
      return;
    }

    setAmount("");
    setDescription("");
    setMode("idle");
    startTransition(() => router.refresh());
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    params.set("page", String(p));
    router.push(`/settings/api-wallet?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
            <Wallet className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              {balance.toLocaleString()} <span className="text-lg font-normal text-gray-500">{currency}</span>
            </p>
          </div>
        </div>

        {mode === "idle" ? (
          <div className="flex gap-3">
            <button
              onClick={() => setMode("add")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Credits
            </button>
            <button
              onClick={() => setMode("deduct")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <Minus className="h-4 w-4" />
              Deduct Credits
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4 mt-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              {mode === "add" ? "Add Credits" : "Deduct Credits"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly top-up"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!amount || !description || isPending}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  mode === "add"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isPending ? "Processing..." : mode === "add" ? "Add Credits" : "Deduct Credits"}
              </button>
              <button
                type="button"
                onClick={() => { setMode("idle"); setError(null); setAmount(""); setDescription(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Transaction History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Description</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">By</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-100">
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {formatRelativeTime(tx.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {tx.type === "CREDIT" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Credit
                    </span>
                  ) : tx.type === "DEBIT" ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Debit
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {tx.type}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>
                    {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                  {tx.description}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                  {tx.performedBy.name}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  No transactions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg p-1.5 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg p-1.5 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

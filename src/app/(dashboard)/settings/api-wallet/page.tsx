import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getWalletBalance, getWalletTransactions } from "@/actions/api-wallet";
import { ApiWalletManager } from "@/components/settings/api-wallet-manager";
import { PageHeader } from "@/components/shared/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ApiWalletPage({ searchParams }: Props) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [wallet, txData] = await Promise.all([
    getWalletBalance(),
    getWalletTransactions(page),
  ]);

  return (
    <>
      <PageHeader title="API Wallet" description="Manage API usage credits" />
      <ApiWalletManager
        balance={wallet.balance}
        currency={wallet.currency}
        transactions={JSON.parse(JSON.stringify(txData.transactions))}
        total={txData.total}
        page={txData.page}
        totalPages={txData.totalPages}
      />
    </>
  );
}

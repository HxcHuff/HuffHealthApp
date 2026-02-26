import { QuotesWorkspace } from "@/components/v2/workspaces/quotes-workspace";
import { quoteRows } from "@/lib/ui-v2-mocks";

export default function QuotesPage() {
  return <QuotesWorkspace initialRows={quoteRows} />;
}

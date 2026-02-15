import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export function ChartCard({ title, children, className, href }: ChartCardProps) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {href && (
          <Link href={href} className="text-xs text-blue-600 hover:underline">
            View details
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

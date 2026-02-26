import { KpiItem } from "@/lib/ui-v2-mocks";

const toneClasses: Record<KpiItem["tone"], string> = {
  neutral: "text-gray-600 bg-gray-50",
  success: "text-emerald-700 bg-emerald-50",
  warning: "text-amber-700 bg-amber-50",
  danger: "text-red-700 bg-red-50",
};

export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{item.value}</p>
          <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${toneClasses[item.tone]}`}>
            {item.delta}
          </span>
        </div>
      ))}
    </div>
  );
}

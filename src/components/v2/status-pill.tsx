const toneMap = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-blue-100 text-blue-700",
  GRACE_PERIOD: "bg-amber-100 text-amber-700",
  LAPSED: "bg-red-100 text-red-700",
  NEW: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  PROPOSAL_SENT: "bg-violet-100 text-violet-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
} as const;

type ToneKey = keyof typeof toneMap;

export function StatusPill({ value }: { value: string }) {
  const key = (value in toneMap ? value : "PENDING") as ToneKey;
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${toneMap[key]}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

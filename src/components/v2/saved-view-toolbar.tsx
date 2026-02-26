export function SavedViewToolbar({ views }: { views: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {views.map((view, idx) => (
        <button
          key={view}
          className={
            idx === 0
              ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
              : "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          }
          type="button"
        >
          {view}
        </button>
      ))}
    </div>
  );
}

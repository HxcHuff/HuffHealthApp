import Link from "next/link";

interface WorkspacePlaceholderProps {
  title: string;
  summary: string;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
}

export function WorkspacePlaceholder({
  title,
  summary,
  primaryCtaHref,
  primaryCtaLabel,
}: WorkspacePlaceholderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{summary}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-700">
          This workspace is scaffolded and ready for UI implementation.
        </p>
        {primaryCtaHref && primaryCtaLabel && (
          <div className="mt-4">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {primaryCtaLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

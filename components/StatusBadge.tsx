import { STATUS_META } from "@/lib/format";

const toneClass = {
  neutral: "border-line bg-canvas-muted text-ink-muted",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-brand-200 bg-brand-50 text-brand-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "neutral" as const };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass[meta.tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

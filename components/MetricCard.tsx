import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5 transition-all duration-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-navy-900">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-ink-dim">{hint}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas-muted text-navy-700">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

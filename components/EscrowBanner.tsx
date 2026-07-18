import { ShieldCheck } from "lucide-react";

export function EscrowBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand-800">
          Protected by licensed escrow partner
        </p>
        <p className={`text-brand-800/70 ${compact ? "text-xs" : "mt-0.5 text-sm"}`}>
          Funds are held by our banking partner — never by Theqa. We orchestrate Trust Engine
          scores, AI insights, Open Banking authorization, and release rules.
        </p>
      </div>
    </div>
  );
}

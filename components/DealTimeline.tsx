"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  CircleDot,
  Lock,
  Package,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import type { Deal } from "@/lib/api";
import { DEAL_FLOW, formatDate, visualStageIndex } from "@/lib/format";
import { Card } from "@/components/ui/Card";

const ICONS: LucideIcon[] = [Rocket, Lock, Package, BadgeCheck, CircleDot];

export function DealTimeline({ deal }: { deal: Deal }) {
  const current = visualStageIndex(deal.status);
  const progress =
    current < 0 ? 0 : current >= DEAL_FLOW.length - 1 ? 100 : (current / (DEAL_FLOW.length - 1)) * 100;

  const events = [...(deal.events ?? [])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">Deal lifecycle</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Initiated → Secured → Fulfillment → Verified → Completed
          </p>
        </div>
        <span className="sandbox-chip">Live</span>
      </div>

      <div className="relative hidden md:block">
        <div className="absolute left-6 right-6 top-[22px] h-0.5 bg-canvas-soft" />
        <motion.div
          className="absolute left-6 top-[22px] h-0.5 bg-gradient-to-r from-navy-800 to-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `calc(${progress}% - 0px)` }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: "calc(100% - 3rem)" }}
        />
        <ol className="relative grid grid-cols-5 gap-2">
          {DEAL_FLOW.map((step, index) => {
            const Icon = ICONS[index];
            const done = current > index || deal.status === "released";
            const active = current === index;
            return (
              <li key={step.key} className="flex flex-col items-center text-center">
                <motion.span
                  animate={active ? { scale: [1, 1.06, 1] } : {}}
                  transition={active ? { repeat: Infinity, duration: 2 } : {}}
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
                    done
                      ? "border-brand-500 bg-brand-600 text-white shadow-brand"
                      : active
                        ? "border-navy-800 bg-navy-900 text-white shadow-navy"
                        : "border-line bg-surface text-ink-dim"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </motion.span>
                <p
                  className={`mt-3 text-xs font-semibold ${
                    active || done ? "text-ink" : "text-ink-dim"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-ink-dim">{step.desc}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <ol className="space-y-4 md:hidden">
        {DEAL_FLOW.map((step, index) => {
          const Icon = ICONS[index];
          const done = current > index || deal.status === "released";
          const active = current === index;
          return (
            <li key={step.key} className="flex gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-brand-500 bg-brand-600 text-white"
                    : active
                      ? "border-navy-800 bg-navy-900 text-white"
                      : "border-line bg-surface text-ink-dim"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.label}</p>
                <p className="text-xs text-ink-muted">{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {events.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="section-label mb-3">Event log</p>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="font-mono text-ink-soft">
                  {e.from_state ?? "—"} → {e.to_state}
                </span>
                <span className="text-ink-dim">{formatDate(e.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

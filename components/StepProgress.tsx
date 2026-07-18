"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type StepItem = {
  id: string;
  label: string;
};

export function StepProgress({
  steps,
  currentId,
  className = "",
}: {
  steps: StepItem[];
  currentId: string;
  className?: string;
}) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === currentId)
  );

  return (
    <nav aria-label="Progress" className={`w-full ${className}`}>
      <ol className="flex items-center gap-0">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-2">
                <motion.span
                  animate={active ? { scale: [1, 1.05, 1] } : {}}
                  transition={active ? { repeat: Infinity, duration: 2.2 } : {}}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                    done
                      ? "bg-brand-600 text-white"
                      : active
                        ? "bg-navy-900 text-white"
                        : "bg-canvas-soft text-ink-dim"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </motion.span>
                <span
                  className={`hidden truncate text-center text-[11px] font-medium sm:block ${
                    active || done ? "text-ink" : "text-ink-dim"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full sm:mx-2 ${
                    index < currentIndex ? "bg-brand-500" : "bg-canvas-soft"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Deal lifecycle steps for workspace / buyer tracking */
export const DEAL_LIFECYCLE_STEPS: StepItem[] = [
  { id: "created", label: "Created" },
  { id: "payment", label: "Payment" },
  { id: "held", label: "Funds held" },
  { id: "shipping", label: "Shipping" },
  { id: "delivered", label: "Delivered" },
  { id: "released", label: "Released" },
];

export function dealLifecycleStepId(status: string): string {
  switch (status) {
    case "draft":
      return "created";
    case "awaiting_funding":
      return "payment";
    case "funded":
      return "held";
    case "in_fulfillment":
      return "shipping";
    case "delivery_confirmed":
    case "release_pending":
      return "delivered";
    case "released":
      return "released";
    default:
      return "created";
  }
}

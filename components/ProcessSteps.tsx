"use client";

import { Check } from "lucide-react";

export type ProcessStep = { id: string; label: string; desc?: string };

export function ProcessSteps({
  steps,
  currentId,
  title,
}: {
  steps: ProcessStep[];
  currentId: string;
  title?: string;
}) {
  const idx = Math.max(
    0,
    steps.findIndex((s) => s.id === currentId)
  );

  return (
    <div>
      {title && <p className="section-label mb-4">{title}</p>}
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-brand-600 text-white"
                      : active
                        ? "bg-navy-900 text-white"
                        : "bg-canvas-soft text-ink-dim"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className={`my-1 w-0.5 flex-1 min-h-[20px] ${
                      done ? "bg-brand-400" : "bg-canvas-soft"
                    }`}
                  />
                )}
              </div>
              <div className="pb-5">
                <p className={`text-sm font-semibold ${active || done ? "text-ink" : "text-ink-dim"}`}>
                  {step.label}
                </p>
                {step.desc && <p className="mt-0.5 text-xs text-ink-muted">{step.desc}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const ORDER_TRACKING_STEPS: ProcessStep[] = [
  { id: "created", label: "Order created", desc: "Deal accepted by buyer" },
  { id: "reserved", label: "Payment reserved", desc: "Held by licensed escrow partner" },
  { id: "processing", label: "Seller processing", desc: "Fulfillment in progress" },
  { id: "shipping", label: "Shipping / delivery", desc: "Buyer confirms receipt" },
  { id: "completed", label: "Completed", desc: "Funds released to seller" },
];

export function orderTrackingStepId(status: string): string {
  switch (status) {
    case "draft":
    case "awaiting_funding":
      return "created";
    case "funded":
      return "reserved";
    case "in_fulfillment":
      return "processing";
    case "delivery_confirmed":
    case "release_pending":
      return "shipping";
    case "released":
      return "completed";
    default:
      return "created";
  }
}

export const OPEN_BANKING_FLOW: ProcessStep[] = [
  { id: "order", label: "Buyer places order" },
  { id: "bank", label: "Bank authorization" },
  { id: "escrow", label: "Money reserved in escrow" },
  { id: "ship", label: "Seller ships / provides service" },
  { id: "confirm", label: "Buyer confirms receiving" },
  { id: "release", label: "Money released to seller" },
];

export const REFUND_FLOW: ProcessStep[] = [
  { id: "request", label: "Refund requested" },
  { id: "pending", label: "Partner processing" },
  { id: "done", label: "Funds returned to buyer" },
];

export const CANCEL_FLOW: ProcessStep[] = [
  { id: "cancel", label: "Cancel deal" },
  { id: "trust", label: "Trust impact recorded" },
  { id: "closed", label: "Deal closed · no escrow hold" },
];

import { Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";

/** Maps deal status → escrow payment language for buyers/sellers */
export function escrowPaymentState(status: string): {
  label: string;
  detail: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
} {
  switch (status) {
    case "draft":
    case "awaiting_funding":
      return {
        label: "Not reserved",
        detail: "No funds held yet. Authorize Open Banking to reserve payment with the partner.",
        tone: "neutral",
      };
    case "funded":
      return {
        label: "Reserved",
        detail: "Your payment is securely held by the licensed escrow partner — not by Theqa.",
        tone: "info",
      };
    case "in_fulfillment":
      return {
        label: "Reserved",
        detail: "Funds remain reserved while the seller fulfills the order.",
        tone: "info",
      };
    case "delivery_confirmed":
      return {
        label: "Under verification",
        detail: "Delivery confirmed. Release to seller can be requested.",
        tone: "warning",
      };
    case "release_pending":
      return {
        label: "Pending release",
        detail: "Partner is releasing funds to the seller.",
        tone: "warning",
      };
    case "released":
      return {
        label: "Released",
        detail: "Partner released item price to the seller and remitted the Protection Fee.",
        tone: "success",
      };
    case "refund_pending":
      return {
        label: "Refund pending",
        detail: "Partner is returning funds to the buyer.",
        tone: "warning",
      };
    case "refunded":
      return {
        label: "Refunded",
        detail: "Partner returned the authorized amount to the buyer.",
        tone: "danger",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        detail: "No escrow hold. Deal cancelled before or without funding.",
        tone: "neutral",
      };
    default:
      return {
        label: status,
        detail: "Partner custody status mirrors deal lifecycle.",
        tone: "neutral",
      };
  }
}

const toneClass = {
  neutral: "border-line bg-canvas-muted text-ink-muted",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-brand-200 bg-brand-50 text-brand-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
};

export function PaymentStatusCard({ status }: { status: string }) {
  const state = escrowPaymentState(status);
  return (
    <Card className={`p-5 ${toneClass[state.tone]} border`}>
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
            Payment status
          </p>
          <p className="mt-1 text-lg font-semibold">{state.label}</p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">{state.detail}</p>
          {["funded", "in_fulfillment", "delivery_confirmed", "release_pending"].includes(
            status
          ) && (
            <p className="mt-3 text-xs font-medium">Your payment is securely held</p>
          )}
        </div>
      </div>
    </Card>
  );
}

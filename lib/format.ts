export const DEAL_FLOW = [
  { key: "awaiting_funding", label: "Initiated", desc: "Deal accepted, awaiting escrow" },
  { key: "funded", label: "Secured", desc: "Funds held by licensed partner" },
  { key: "in_fulfillment", label: "Fulfillment", desc: "Seller shipped / handover" },
  { key: "delivery_confirmed", label: "Verified", desc: "Buyer confirmed delivery" },
  { key: "released", label: "Completed", desc: "Funds released to seller" },
] as const;

/** Map API states onto the 5-stage visual machine */
export function visualStageIndex(status: string): number {
  switch (status) {
    case "draft":
      return -1;
    case "awaiting_funding":
      return 0;
    case "funded":
      return 1;
    case "in_fulfillment":
      return 2;
    case "delivery_confirmed":
    case "release_pending":
      return 3;
    case "released":
      return 4;
    default:
      return -1;
  }
}

export const STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  awaiting_funding: { label: "Initiated", tone: "warning" },
  funded: { label: "Secured", tone: "info" },
  in_fulfillment: { label: "Fulfillment", tone: "info" },
  delivery_confirmed: { label: "Verified", tone: "success" },
  release_pending: { label: "Releasing", tone: "warning" },
  released: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  refund_pending: { label: "Refund Pending", tone: "warning" },
  refunded: { label: "Refunded", tone: "danger" },
};

export function formatMoney(amount: number, currency = "JOD") {
  try {
    return new Intl.NumberFormat("en-JO", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

export function humanizeKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreColor(score: number) {
  if (score >= 70) return { stroke: "#059669", text: "text-brand-600", glow: "rgba(16,185,129,0.25)" };
  if (score >= 40) return { stroke: "#d97706", text: "text-amber-600", glow: "rgba(245,158,11,0.2)" };
  return { stroke: "#dc2626", text: "text-red-600", glow: "rgba(220,38,38,0.2)" };
}

export function scoreBand(score: number) {
  if (score >= 80) return "Exemplary";
  if (score >= 60) return "Trusted";
  if (score >= 40) return "Building";
  return "High risk";
}

export function feePreview(amount: number, feeBps: number, _feePayer?: string) {
  /** @deprecated Prefer protectionFeeBreakdown — MVP is always buyer-pays. */
  return protectionFeeBreakdown(amount, feeBps);
}

/** MVP: buyer pays Theqa Protection Fee; seller receives full item price. */
export function protectionFeeBreakdown(amount: number, feeBps: number) {
  const protectionFee = amount * (feeBps / 10000);
  return {
    itemPrice: amount,
    protectionFee,
    buyerPays: amount + protectionFee,
    sellerReceives: amount,
    /** @deprecated alias — use protectionFee */
    platformFee: protectionFee,
  };
}

export const PROTECTION_FEE_BLURB =
  "Covers escrow orchestration, trust verification, and secure release workflow.";


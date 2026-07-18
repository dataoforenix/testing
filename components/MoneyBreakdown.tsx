"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  PROTECTION_FEE_BLURB,
  formatMoney,
  protectionFeeBreakdown,
} from "@/lib/format";

export type MoneyBreakdownProps = {
  itemPrice: number;
  feeBps?: number;
  feeAmount?: number | null;
  currency?: string;
  variant?: "card" | "embedded" | "compact";
  className?: string;
  title?: string;
  showCustodyNote?: boolean;
};

/**
 * Canonical money block — use everywhere money is shown.
 * Item Price → Theqa Protection Fee → Total Buyer Pays → Seller Receives
 */
export function MoneyBreakdown({
  itemPrice,
  feeBps = 0,
  feeAmount,
  currency = "JOD",
  variant = "card",
  className = "",
  title = "Payment summary",
  showCustodyNote = true,
}: MoneyBreakdownProps) {
  const fromBps = protectionFeeBreakdown(itemPrice, feeBps);
  const protectionFee =
    feeAmount != null && !Number.isNaN(Number(feeAmount))
      ? Number(feeAmount)
      : fromBps.protectionFee;
  const buyerPays = itemPrice + protectionFee;
  const sellerReceives = itemPrice;
  const feePct = feeBps > 0 ? (feeBps / 100).toFixed(feeBps % 100 === 0 ? 0 : 2) : null;

  const rows = (
    <dl className="space-y-3 text-sm">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
        <dt className="text-ink-muted">Item Price</dt>
        <dd className="font-mono font-medium text-ink">{formatMoney(itemPrice, currency)}</dd>
      </div>

      <div className="border-b border-line pb-3">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-ink-muted">
            Theqa Protection Fee
            {feePct != null && (
              <span className="ml-1.5 font-mono text-[10px] text-ink-dim">{feePct}%</span>
            )}
          </dt>
          <dd className="font-mono font-medium text-ink">{formatMoney(protectionFee, currency)}</dd>
        </div>
        <p className="mt-1.5 max-w-[18rem] text-[11px] leading-relaxed text-ink-dim">
          {PROTECTION_FEE_BLURB}
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
        <dt className="font-semibold text-ink">Total Buyer Pays</dt>
        <dd className="font-mono text-lg font-semibold text-navy-900">
          {formatMoney(buyerPays, currency)}
        </dd>
      </div>

      <div className="flex items-start justify-between gap-4">
        <dt className="text-ink-muted">Seller Receives</dt>
        <dd className="font-mono font-semibold text-brand-600">
          {formatMoney(sellerReceives, currency)}
        </dd>
      </div>
    </dl>
  );

  const custody = showCustodyNote ? (
    <p className="mt-4 flex gap-2 text-[11px] leading-relaxed text-ink-dim">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
      <span>
        Total Buyer Pays is held by our licensed escrow partner. Theqa never holds customer funds —
        we orchestrate release and trust.
      </span>
    </p>
  ) : null;

  if (variant === "embedded" || variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        {title && variant !== "compact" && (
          <p className="section-label mb-3">{title}</p>
        )}
        {rows}
        {custody}
      </motion.div>
    );
  }

  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <p className="section-label">{title}</p>
      <div className="mt-4">{rows}</div>
      {custody}
    </Card>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CHECKOUT_FLOW_STEPS, useCheckout } from "@/components/checkout/CheckoutContext";
import { EscrowBanner } from "@/components/EscrowBanner";
import { MoneyBreakdown } from "@/components/MoneyBreakdown";
import { PrimaryCTA } from "@/components/PrimaryCTA";
import { StatusBadge } from "@/components/StatusBadge";
import { StepProgress } from "@/components/StepProgress";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function CheckoutSummaryPage() {
  const { deal, loading, code } = useCheckout();

  if (loading || !deal) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <StepProgress steps={[...CHECKOUT_FLOW_STEPS]} currentId="summary" />

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={deal.status} />
          <span className="font-mono text-xs text-ink-dim">{deal.public_code}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{deal.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {deal.description || "Protected purchase · funds held by licensed escrow partner."}
        </p>
      </div>

      <EscrowBanner compact />

      <MoneyBreakdown
        itemPrice={deal.amount}
        feeBps={deal.fee_bps}
        feeAmount={deal.fee_amount}
        currency={deal.currency}
        title="What you pay"
      />

      <Card className="p-4 text-sm text-ink-muted">
        Next you will review the merchant Trust Score, then an AI insight — then confirm.
      </Card>

      <PrimaryCTA href={`/checkout/${code}/trust`}>Continue</PrimaryCTA>
      <Link href="/" className="block text-center text-xs text-ink-dim hover:text-ink">
        Cancel
      </Link>
    </motion.div>
  );
}

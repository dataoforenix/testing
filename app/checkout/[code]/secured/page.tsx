"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useCheckout } from "@/components/checkout/CheckoutContext";
import { MoneyBreakdown } from "@/components/MoneyBreakdown";
import { PrimaryCTA } from "@/components/PrimaryCTA";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function CheckoutSecuredPage() {
  const { deal, loading } = useCheckout();

  if (loading || !deal) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 py-6"
    >
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-navy-900">
          Funds secured
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Held by our licensed escrow partner. Theqa never held your money.
        </p>
      </div>

      <Card className="flex gap-3 border-brand-200 bg-brand-50 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
        <p className="text-sm text-brand-900">
          Partner escrow hold confirmed for <span className="font-semibold">{deal.title}</span>.
        </p>
      </Card>

      <MoneyBreakdown
        itemPrice={deal.amount}
        feeBps={deal.fee_bps}
        feeAmount={deal.fee_amount}
        currency={deal.currency}
        title="Held amount"
      />

      <PrimaryCTA href={`/deals/${deal.id}`}>Track purchase</PrimaryCTA>
    </motion.div>
  );
}

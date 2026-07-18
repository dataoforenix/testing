"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CHECKOUT_FLOW_STEPS, useCheckout } from "@/components/checkout/CheckoutContext";
import { PrimaryCTA } from "@/components/PrimaryCTA";
import { StepProgress } from "@/components/StepProgress";
import { TrustBreakdown, TrustScoreCard } from "@/components/TrustScoreCard";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function CheckoutTrustPage() {
  const { deal, sellerTrust, loading, code, me } = useCheckout();

  if (loading || !deal) return <PageSkeleton />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <StepProgress steps={[...CHECKOUT_FLOW_STEPS]} currentId="trust" />

      <div>
        <p className="section-label">Trust Engine</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">
          Review merchant trust
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Calculated by Theqa Trust Engine — not by AI. Separate from advisory insights on the next
          step.
        </p>
      </div>

      <TrustScoreCard
        score={sellerTrust}
        title="Merchant Trust Score"
        verification={{
          email: Boolean(me?.user.email),
          phone: Boolean(me?.user.phone_e164),
          identity: false,
        }}
      />
      <TrustBreakdown score={sellerTrust} title="Score factors" />

      <PrimaryCTA href={`/checkout/${code}/ai`}>Continue</PrimaryCTA>
      <Link
        href={`/checkout/${code}/summary`}
        className="block text-center text-xs text-ink-dim hover:text-ink"
      >
        Back
      </Link>
    </motion.div>
  );
}

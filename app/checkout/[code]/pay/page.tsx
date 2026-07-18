"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { authHref, rememberReturnPath } from "@/lib/auth-redirect";
import { formatMoney, protectionFeeBreakdown } from "@/lib/format";
import { CHECKOUT_FLOW_STEPS, useCheckout } from "@/components/checkout/CheckoutContext";
import { MoneyBreakdown } from "@/components/MoneyBreakdown";
import { PrimaryCTA } from "@/components/PrimaryCTA";
import { StepProgress } from "@/components/StepProgress";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

/** Pay entry only — one CTA to Open Banking. */
export default function CheckoutPayPage() {
  const { deal, loggedIn, loading, code } = useCheckout();

  if (loading || !deal) return <PageSkeleton />;

  if (deal.status === "draft") {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-ink-muted">Accept the deal before paying.</p>
        <PrimaryCTA href={`/checkout/${code}/accept`}>Go to accept</PrimaryCTA>
      </div>
    );
  }

  if (deal.status !== "awaiting_funding") {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-ink-muted">Payment is not required for this deal status.</p>
        <PrimaryCTA href={`/deals/${deal.id}`}>Open deal workspace</PrimaryCTA>
      </div>
    );
  }

  const money = protectionFeeBreakdown(deal.amount, deal.fee_bps);
  const path = `/checkout/${code}/pay`;
  const loginHref = authHref("/login", path);
  const bankHref = `/pay/banks?deal=${deal.id}&code=${deal.public_code}`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <StepProgress steps={[...CHECKOUT_FLOW_STEPS]} currentId="pay" />

      <div>
        <p className="section-label">Open Banking</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">
          Pay with your bank
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Authorize payment to our licensed escrow partner. Theqa never holds your funds.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-line bg-navy-900 px-5 py-4 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-300">
            Total to authorize
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {formatMoney(money.buyerPays, deal.currency)}
          </p>
        </div>
        <div className="p-5">
          <MoneyBreakdown
            variant="embedded"
            itemPrice={deal.amount}
            feeBps={deal.fee_bps}
            feeAmount={deal.fee_amount}
            currency={deal.currency}
            title="Breakdown"
          />
        </div>
      </Card>

      {!loggedIn && (
        <Card className="p-4 text-sm text-ink-muted">
          <Link
            href={loginHref}
            className="font-semibold text-navy-900 hover:underline"
            onClick={() => rememberReturnPath(path)}
          >
            Sign in
          </Link>{" "}
          to continue to your bank.
        </Card>
      )}

      <PrimaryCTA
        variant="brand"
        href={loggedIn ? bankHref : loginHref}
        onClick={
          loggedIn
            ? undefined
            : () => {
                rememberReturnPath(path);
              }
        }
      >
        <Building2 className="h-4 w-4" />
        Continue with your bank
      </PrimaryCTA>
    </motion.div>
  );
}

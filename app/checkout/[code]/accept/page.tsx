"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { api, getAccessToken, type Deal } from "@/lib/api";
import { authHref, rememberReturnPath } from "@/lib/auth-redirect";
import { formatMoney, protectionFeeBreakdown } from "@/lib/format";
import { CHECKOUT_FLOW_STEPS, useCheckout } from "@/components/checkout/CheckoutContext";
import { MoneyBreakdown } from "@/components/MoneyBreakdown";
import { PrimaryCTA } from "@/components/PrimaryCTA";
import { StepProgress } from "@/components/StepProgress";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

/** Accept-only step — one CTA. */
export default function CheckoutAcceptPage() {
  const { push } = useToast();
  const router = useRouter();
  const { deal, loggedIn, loading, code, setDeal } = useCheckout();
  const [busy, setBusy] = useState(false);

  if (loading || !deal) return <PageSkeleton />;

  if (deal.status === "awaiting_funding") {
    router.replace(`/checkout/${code}/pay`);
    return <PageSkeleton />;
  }

  if (deal.status !== "draft") {
    router.replace(`/checkout/${code}`);
    return <PageSkeleton />;
  }

  const money = protectionFeeBreakdown(deal.amount, deal.fee_bps);
  const path = `/checkout/${code}/accept`;
  const loginHref = authHref("/login", path);

  async function accept() {
    if (!getAccessToken()) {
      rememberReturnPath(path);
      window.location.href = loginHref;
      return;
    }
    setBusy(true);
    try {
      const updated = await api<Deal>(`/v1/deals/${deal!.id}/accept`, { method: "POST" });
      setDeal(updated);
      push({ tone: "success", title: "Deal accepted" });
      router.push(`/checkout/${code}/pay`);
    } catch (err) {
      push({
        tone: "error",
        title: "Accept failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <StepProgress steps={[...CHECKOUT_FLOW_STEPS]} currentId="confirm" />
      <div>
        <p className="section-label">Accept</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">
          Accept this deal
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          You become the buyer. Next you will authorize Open Banking payment to the escrow partner.
        </p>
      </div>

      <Card className="p-5">
        <p className="font-semibold text-ink">{deal.title}</p>
        <p className="mt-2 font-mono text-xl font-semibold text-navy-900">
          {formatMoney(money.buyerPays, deal.currency)}
        </p>
        <p className="mt-1 text-xs text-ink-dim">Total buyer pays</p>
      </Card>

      <MoneyBreakdown
        itemPrice={deal.amount}
        feeBps={deal.fee_bps}
        feeAmount={deal.fee_amount}
        currency={deal.currency}
      />

      {!loggedIn && (
        <Card className="p-4 text-sm text-ink-muted">
          <Link href={loginHref} className="font-semibold text-navy-900 hover:underline">
            Sign in
          </Link>{" "}
          as a buyer to accept.
        </Card>
      )}

      <PrimaryCTA loading={busy} onClick={accept}>
        <Lock className="h-4 w-4" />
        Accept deal
      </PrimaryCTA>
      <Link
        href={`/checkout/${code}/ai`}
        className="block text-center text-xs text-ink-dim hover:text-ink"
      >
        Back
      </Link>
    </motion.div>
  );
}

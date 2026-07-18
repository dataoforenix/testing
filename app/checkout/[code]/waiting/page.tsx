"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { api, type Deal } from "@/lib/api";
import { CHECKOUT_FLOW_STEPS, useCheckout } from "@/components/checkout/CheckoutContext";
import { StepProgress } from "@/components/StepProgress";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

/** Waiting for partner webhook → funded. */
export default function CheckoutWaitingPage() {
  const router = useRouter();
  const { deal, loading, code, reload } = useCheckout();
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (loading || !deal) return;
    if (deal.status === "funded") {
      router.replace(`/checkout/${code}/secured`);
      return;
    }
    let cancelled = false;
    async function poll() {
      for (let i = 0; i < 20; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 500));
        setTicks((t) => t + 1);
        try {
          const d = await api<Deal>(`/v1/deals/by-code/${code}`, { auth: false });
          if (d.status === "funded") {
            await reload();
            router.replace(`/checkout/${code}/secured`);
            return;
          }
        } catch {
          /* keep polling */
        }
      }
    }
    void poll();
    return () => {
      cancelled = true;
    };
  }, [deal, loading, code, router, reload]);

  if (loading || !deal) return <PageSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 py-8 text-center"
    >
      <StepProgress steps={[...CHECKOUT_FLOW_STEPS]} currentId="pay" />
      <Card className="mx-auto max-w-sm p-8">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-navy-900" />
        <h1 className="mt-5 text-xl font-semibold text-navy-900">Securing funds…</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Waiting for the licensed escrow partner to confirm the hold. Theqa never holds your money.
        </p>
        <p className="mt-4 font-mono text-xs text-ink-dim">Poll {ticks}</p>
      </Card>
    </motion.div>
  );
}

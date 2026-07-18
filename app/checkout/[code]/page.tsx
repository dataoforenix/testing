"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useCheckout } from "@/components/checkout/CheckoutContext";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

function RedirectInner() {
  const { push } = useToast();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const { deal, loading, error } = useCheckout();
  const code = params.code;

  useEffect(() => {
    if (searchParams.get("funded") === "1") {
      push({
        tone: "success",
        title: "Funds secured",
        description: "Held by licensed escrow partner",
      });
    }
    if (searchParams.get("denied") === "1") {
      push({
        tone: "info",
        title: "Authorization cancelled",
        description: "No funds were moved",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!deal) return;

    if (
      ["funded", "in_fulfillment", "delivery_confirmed", "release_pending", "released"].includes(
        deal.status
      )
    ) {
      if (searchParams.get("funded") === "1") {
        router.replace(`/checkout/${code}/secured`);
        return;
      }
      router.replace(`/deals/${deal.id}`);
      return;
    }

    if (deal.status === "awaiting_funding") {
      router.replace(`/checkout/${code}/pay`);
      return;
    }

    router.replace(`/checkout/${code}/summary`);
  }, [deal, loading, code, router, searchParams]);

  if (error && !loading) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink">Checkout unavailable</h1>
        <p className="mt-2 text-ink-muted">{error}</p>
        <span className="sandbox-chip mt-4 inline-flex">Sandbox</span>
      </div>
    );
  }

  return <PageSkeleton />;
}

export default function CheckoutIndexPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RedirectInner />
    </Suspense>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCheckout } from "@/components/checkout/CheckoutContext";
import { PageSkeleton } from "@/components/ui/Skeleton";

/** Legacy confirm route → accept or pay (one responsibility each). */
export default function CheckoutConfirmRedirect() {
  const router = useRouter();
  const { deal, loading, code } = useCheckout();

  useEffect(() => {
    if (loading || !deal) return;
    if (deal.status === "draft") {
      router.replace(`/checkout/${code}/accept`);
      return;
    }
    if (deal.status === "awaiting_funding") {
      router.replace(`/checkout/${code}/pay`);
      return;
    }
    router.replace(`/checkout/${code}`);
  }, [deal, loading, code, router]);

  return <PageSkeleton />;
}

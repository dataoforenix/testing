"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, getAccessToken, type Deal, type MeResponse } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { SuccessCelebration } from "@/components/SuccessModal";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function ReleaseSuccessPage() {
  const { push } = useToast();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        window.location.href = "/login";
        return;
      }
      try {
        const [d, m] = await Promise.all([
          api<Deal>(`/v1/deals/${id}`),
          api<MeResponse>("/v1/me"),
        ]);
        setDeal(d);
        setMe(m);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading || !deal || !me) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  const fee = deal.fee_amount ?? deal.amount * (deal.fee_bps / 10000);
  const isSeller = me.user.id === deal.seller_user_id;
  const role = isSeller ? "merchant" : "buyer";

  return (
    <AppShell>
      <SuccessCelebration
        title={deal.title}
        itemPrice={deal.amount}
        fee={fee}
        feeBps={deal.fee_bps}
        currency={deal.currency}
        code={deal.public_code}
        role={role}
        onDownload={() =>
          push({
            tone: "info",
            title: "Receipt ready",
            description: "PDF download simulated for demo.",
          })
        }
      />
    </AppShell>
  );
}

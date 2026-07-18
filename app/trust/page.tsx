"use client";

import { useEffect, useState } from "react";
import {
  api,
  getAccessToken,
  type MeResponse,
  type TrustScore,
} from "@/lib/api";
import { isMerchantUser } from "@/lib/roles";
import { AppShell, Topbar } from "@/components/AppShell";
import { TrustBreakdown, TrustScoreCard } from "@/components/TrustScoreCard";
import { TrustImpactNotice } from "@/components/TrustImpactNotice";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

/** Trust Engine only — never mix AI here. */
export default function TrustPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [trust, setTrust] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        window.location.href = "/login";
        return;
      }
      try {
        const meRes = await api<MeResponse>("/v1/me");
        setMe(meRes);
        const merchant = meRes.orgs.find((o) => o.type === "merchant");
        const entityType = merchant ? "merchant" : "individual";
        const entityId = merchant ? merchant.id : meRes.user.id;
        try {
          setTrust(
            await api<TrustScore>(`/v1/trust/scores/${entityType}/${entityId}`, { auth: false })
          );
        } catch {
          setTrust(null);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  const merchant = isMerchantUser(me);

  return (
    <AppShell>
      <Topbar
        title="Trust Engine"
        subtitle="Scores are calculated by Theqa Trust Engine — not by AI"
      />

      <div className="mx-auto grid max-w-2xl gap-4">
        <TrustScoreCard
          score={trust}
          title={merchant ? "Merchant Trust Score" : "Your Trust Score"}
          verification={{
            email: Boolean(me?.user.email),
            phone: Boolean(me?.user.phone_e164),
            identity: false,
          }}
        />
        <TrustBreakdown score={trust} title="Weighted signals" />

        <TrustImpactNotice
          role={merchant ? "seller" : "buyer"}
          scenario="generic"
        />

        <Card className="p-5">
          <p className="section-label">How scores are calculated</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {merchant ? (
              <>
                <li>Delivery speed and fulfillment completion</li>
                <li>Service / product quality signals and ratings</li>
                <li>Customer ratings and dispute outcomes</li>
                <li>Cancellation and refund rates</li>
              </>
            ) : (
              <>
                <li>Order history and successful completions</li>
                <li>Payment commitment (authorized vs abandoned)</li>
                <li>Cancellation rate after accept</li>
                <li>Number of disputes opened</li>
              </>
            )}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">
            Example: &ldquo;Your Trust Score decreased by 5 points because you cancelled 2 confirmed
            orders.&rdquo; Explanations come from Trust Engine factors — AI only narrates them on the
            AI page.
          </p>
        </Card>

        <Card className="p-5">
          <p className="section-label">Verification</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li className="flex justify-between">
              <span>Email</span>
              <span className="text-ink-dim">
                {me?.user.email ? "On file · Sandbox" : "Pending"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Phone</span>
              <span className="text-ink-dim">
                {me?.user.phone_e164 ? "On file · Sandbox" : "Pending"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Identity</span>
              <span className="text-ink-dim">Sandbox · pending KYC</span>
            </li>
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-dim">
            Trust Scores use identity, transaction history, disputes, ratings, and account age
            (individual) or order volume, refunds, and response time (merchant). Cold-start priors
            apply until enough signals exist.
          </p>
        </Card>

        <Card className="border-dashed p-4 text-xs text-ink-dim">
          Looking for AI insights? Open the{" "}
          <a href="/ai" className="font-semibold text-navy-900 hover:underline">
            AI Insights
          </a>{" "}
          page — advisory only, separate from Trust Engine.
        </Card>
      </div>
    </AppShell>
  );
}

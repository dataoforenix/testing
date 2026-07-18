"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Users } from "lucide-react";
import {
  api,
  getAccessToken,
  type Deal,
  type MeResponse,
  type TrustScore,
} from "@/lib/api";
import { formatDate, formatMoney, protectionFeeBreakdown } from "@/lib/format";
import { AiInsightCard } from "@/components/AiInsightCard";
import { AppShell, Topbar } from "@/components/AppShell";
import { CustodyCard, type DealCustody } from "@/components/CustodyCard";
import { DealActions } from "@/components/DealActions";
import { DealTimeline } from "@/components/DealTimeline";
import { EscrowBanner } from "@/components/EscrowBanner";
import { MoneyBreakdown } from "@/components/MoneyBreakdown";
import { PaymentStatusCard } from "@/components/PaymentStatusCard";
import {
  OPEN_BANKING_FLOW,
  ORDER_TRACKING_STEPS,
  orderTrackingStepId,
  ProcessSteps,
} from "@/components/ProcessSteps";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DEAL_LIFECYCLE_STEPS,
  dealLifecycleStepId,
  StepProgress,
} from "@/components/StepProgress";
import { TrustScoreCard } from "@/components/TrustScoreCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type Fulfillment = {
  deal_id: string;
  shipments: Array<{
    id: string;
    tracking_number?: string | null;
    carrier?: string | null;
    status: string;
    created_at: string;
  }>;
  confirmations: Array<{
    id: string;
    user_id: string;
    notes?: string | null;
    created_at: string;
  }>;
};

export default function DealWorkspacePage() {
  const { push } = useToast();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [custody, setCustody] = useState<DealCustody | null>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);
  const [sellerTrust, setSellerTrust] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);

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

      try {
        setCustody(await api<DealCustody>(`/v1/deals/${id}/custody`));
      } catch {
        setCustody(null);
      }
      try {
        setFulfillment(await api<Fulfillment>(`/v1/deals/${id}/fulfillment`));
      } catch {
        setFulfillment(null);
      }
      try {
        setSellerTrust(
          await api<TrustScore>(`/v1/trust/scores/merchant/${d.org_id}`, { auth: false })
        );
      } catch {
        setSellerTrust(null);
      }
    } catch (err) {
      push({
        tone: "error",
        title: "Deal unavailable",
        description: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !deal || !me) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  const money = protectionFeeBreakdown(deal.amount, deal.fee_bps);
  const invoiceNo = `INV-${deal.public_code}-${deal.created_at.slice(0, 10).replace(/-/g, "")}`;

  function downloadInvoice() {
    const d = deal!;
    const lines = [
      "Theqa AI · Escrow orchestration invoice (sandbox)",
      `Invoice: ${invoiceNo}`,
      `Order: ${d.public_code}`,
      `Deal ID: ${d.id}`,
      `Title: ${d.title}`,
      `Date: ${formatDate(d.created_at)}`,
      `Status: ${d.status}`,
      `Item price: ${formatMoney(d.amount, d.currency)}`,
      `Protection fee: ${formatMoney(money.protectionFee, d.currency)}`,
      `Buyer total authorized: ${formatMoney(money.buyerPays, d.currency)}`,
      `Seller receives (on release): ${formatMoney(d.amount, d.currency)}`,
      "",
      "Payment custody: licensed escrow partner (Open Banking).",
      "Theqa never holds customer funds.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <Topbar
        title={deal.title}
        subtitle={`${formatMoney(money.buyerPays, deal.currency)} · ${deal.public_code}`}
        action={<StatusBadge status={deal.status} />}
      />

      <div className="mb-8">
        <StepProgress
          steps={DEAL_LIFECYCLE_STEPS}
          currentId={dealLifecycleStepId(deal.status)}
        />
      </div>

      <div className="mb-6">
        <EscrowBanner compact />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="grid gap-6 p-5 md:grid-cols-2">
            <ProcessSteps
              title="Order tracking"
              steps={ORDER_TRACKING_STEPS}
              currentId={orderTrackingStepId(deal.status)}
            />
            <div>
              <PaymentStatusCard status={deal.status} />
              <div className="mt-4">
                <ProcessSteps
                  title="Open Banking payment flow"
                  steps={OPEN_BANKING_FLOW}
                  currentId={
                    deal.status === "draft" || deal.status === "awaiting_funding"
                      ? "order"
                      : deal.status === "funded"
                        ? "escrow"
                        : deal.status === "in_fulfillment"
                          ? "ship"
                          : deal.status === "delivery_confirmed" ||
                              deal.status === "release_pending"
                            ? "confirm"
                            : deal.status === "released"
                              ? "release"
                              : "bank"
                  }
                />
              </div>
            </div>
          </Card>

          <DealTimeline deal={deal} />

          <MoneyBreakdown
            itemPrice={deal.amount}
            feeBps={deal.fee_bps}
            feeAmount={deal.fee_amount}
            currency={deal.currency}
            title="Money"
          />

          <Card className="p-5">
            <p className="section-label">Invoice</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Invoice number</dt>
                <dd className="font-mono text-xs">{invoiceNo}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Payment details</dt>
                <dd className="text-right text-xs text-ink-soft">
                  Open Banking → partner escrow · {formatMoney(money.buyerPays, deal.currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Order date</dt>
                <dd className="text-xs">{formatDate(deal.created_at)}</dd>
              </div>
            </dl>
            <Button variant="secondary" className="mt-4 w-full" onClick={downloadInvoice}>
              <Download className="h-4 w-4" />
              Download invoice
            </Button>
          </Card>

          <CustodyCard custody={custody} />

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-navy-700" />
              <p className="section-label">Participants</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {(deal.participants ?? []).length === 0 ? (
                <li className="text-ink-dim">No participants recorded yet.</li>
              ) : (
                (deal.participants ?? []).map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="capitalize text-ink">{p.role}</span>
                    <span className="font-mono text-xs text-ink-dim">
                      {p.user_id?.slice(0, 8) ?? "—"} · {formatDate(p.joined_at ?? deal.created_at)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card className="p-5">
            <p className="section-label">Shipping & confirmation</p>
            {fulfillment && fulfillment.shipments.length === 0 && fulfillment.confirmations.length === 0 ? (
              <p className="mt-3 text-sm text-ink-dim">No shipment or confirmation yet.</p>
            ) : (
              <div className="mt-4 space-y-4 text-sm">
                {fulfillment?.shipments.map((s) => (
                  <div key={s.id} className="rounded-xl border border-line bg-canvas-muted p-3">
                    <p className="font-medium text-ink">
                      {s.carrier || "Carrier"} · {s.status}
                    </p>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      {s.tracking_number || "No tracking"}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-dim">{formatDate(s.created_at)}</p>
                  </div>
                ))}
                {fulfillment?.confirmations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-line p-3">
                    <p className="font-medium text-ink">Delivery confirmed</p>
                    <p className="mt-1 text-xs text-ink-muted">{c.notes || "No notes"}</p>
                    <p className="mt-1 text-[11px] text-ink-dim">{formatDate(c.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <TrustScoreCard score={sellerTrust} title="Merchant Trust Score" />

          <AiInsightCard
            endpoint="risk-analysis"
            body={{
              deal_id: deal.id,
              title: deal.title,
              amount: deal.amount,
              currency: deal.currency,
              status: deal.status,
              fee_bps: deal.fee_bps,
            }}
          />
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <DealActions deal={deal} me={me} onUpdated={load} />
        </div>
      </div>
    </AppShell>
  );
}

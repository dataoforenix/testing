"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Lock,
  PackageCheck,
  Shield,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  api,
  getAccessToken,
  type Deal,
  type MeResponse,
  type TrustScore,
} from "@/lib/api";
import { formatDate, formatMoney, protectionFeeBreakdown } from "@/lib/format";
import {
  ACTIVE_PURCHASE_STATUSES,
  isMerchantUser,
  nextActionLabel,
  primaryOrg,
} from "@/lib/roles";
import { AppShell, Topbar } from "@/components/AppShell";
import { AiInsightCard } from "@/components/AiInsightCard";
import { EmptyState } from "@/components/EmptyState";
import { EscrowBanner } from "@/components/EscrowBanner";
import { MetricCard } from "@/components/MetricCard";
import { PaymentStatusCard } from "@/components/PaymentStatusCard";
import {
  ORDER_TRACKING_STEPS,
  orderTrackingStepId,
  ProcessSteps,
} from "@/components/ProcessSteps";
import { StatusBadge } from "@/components/StatusBadge";
import { trustHintFromEvents } from "@/components/TrustImpactNotice";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

function dealNextHref(deal: Deal, asBuyer: boolean) {
  if (asBuyer && deal.status === "draft") return `/checkout/${deal.public_code}/summary`;
  if (asBuyer && deal.status === "awaiting_funding") {
    return `/checkout/${deal.public_code}/pay`;
  }
  return `/deals/${deal.id}`;
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [trust, setTrust] = useState<TrustScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        window.location.href = "/portal";
        return;
      }
      try {
        const meRes = await api<MeResponse>("/v1/me");
        setMe(meRes);
        setDeals(await api<Deal[]>("/v1/deals"));
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        // Invalid session → portal gateway
        if (String(err).includes("401") || (err as { status?: number })?.status === 401) {
          window.location.href = "/portal";
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

  if (isMerchantUser(me)) {
    return (
      <MerchantOverview
        me={me}
        orgName={primaryOrg(me)?.name}
        deals={deals}
        trust={trust}
        error={error}
      />
    );
  }

  return <BuyerPurchases me={me} deals={deals} trust={trust} error={error} />;
}

function MerchantOverview({
  me,
  orgName,
  deals,
  trust,
  error,
}: {
  me: MeResponse | null;
  orgName?: string;
  deals: Deal[];
  trust: TrustScore | null;
  error: string | null;
}) {
  const buckets = useMemo(() => {
    const active = deals.filter((d) =>
      ["funded", "in_fulfillment", "delivery_confirmed", "release_pending"].includes(d.status)
    );
    const pending = deals.filter((d) =>
      ["draft", "awaiting_funding"].includes(d.status)
    );
    const orders = deals.filter((d) =>
      ["funded", "in_fulfillment", "delivery_confirmed"].includes(d.status)
    );
    const released = deals.filter((d) => d.status === "released");
    const volume = released.reduce((sum, d) => sum + d.amount, 0);
    const escrowVolume = active.reduce((sum, d) => sum + d.amount, 0);
    return { active, pending, orders, released, volume, escrowVolume };
  }, [deals]);

  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    buckets.released.forEach((d) => {
      const key = new Date(d.updated_at).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      });
      byDay.set(key, (byDay.get(key) ?? 0) + d.amount);
    });
    if (byDay.size === 0) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri"].map((name) => ({ name, volume: 0 }));
    }
    return Array.from(byDay.entries())
      .slice(-7)
      .map(([name, volume]) => ({ name, volume }));
  }, [buckets.released]);

  return (
    <AppShell>
      <Topbar
        title="Seller dashboard"
        subtitle={`${orgName ?? "Merchant"} · ${me?.user.email ?? me?.user.phone_e164 ?? ""}`}
      />

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}
      <div className="mb-6">
        <EscrowBanner compact />
      </div>

      {/* Earnings */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">Earnings</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Released earnings"
            value={formatMoney(buckets.volume)}
            hint={`${buckets.released.length} completed · seller receives item price`}
            icon={<Lock className="h-4 w-4" />}
          />
          <MetricCard
            label="In partner escrow"
            value={formatMoney(buckets.escrowVolume)}
            hint="Reserved · not yet released"
            icon={<Activity className="h-4 w-4" />}
          />
          <MetricCard
            label="Orders to fulfill"
            value={String(buckets.orders.length)}
            hint="Ship or await confirmation"
            icon={<PackageCheck className="h-4 w-4" />}
          />
        </div>
        <Card className="mt-4 p-5">
          <p className="text-xs text-ink-muted mb-3">Released volume</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} width={40} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }} />
                <Area type="monotone" dataKey="volume" stroke="#059669" strokeWidth={2} fill="url(#vol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Active deals</h2>
            <Link href="/deals" className="text-xs font-semibold text-navy-900 hover:underline">
              View all
            </Link>
          </div>
          {buckets.active.length === 0 ? (
            <Card className="p-6 text-sm text-ink-dim">No active escrow deals.</Card>
          ) : (
            <ul className="space-y-2">
              {buckets.active.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/deals/${d.id}`}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm hover:border-navy-200"
                  >
                    <div>
                      <p className="font-medium text-ink">{d.title}</p>
                      <p className="text-xs text-ink-muted">{nextActionLabel(d.status, "seller")}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Pending deals</h2>
          {buckets.pending.length === 0 ? (
            <Card className="p-6 text-sm text-ink-dim">
              No pending deals.{" "}
              {deals.length === 0 && (
                <Link href="/deals/new" className="font-semibold text-navy-900 hover:underline">
                  Create your first deal
                </Link>
              )}
            </Card>
          ) : (
            <ul className="space-y-2">
              {buckets.pending.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/deals/${d.id}`}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm hover:border-navy-200"
                  >
                    <div>
                      <p className="font-medium text-ink">{d.title}</p>
                      <p className="text-xs text-ink-muted">{d.public_code}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Orders</h2>
          <Card className="divide-y divide-line p-0 overflow-hidden">
            {buckets.orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-dim">No open orders.</p>
            ) : (
              buckets.orders.slice(0, 6).map((d) => (
                <Link
                  key={d.id}
                  href={`/deals/${d.id}`}
                  className="flex items-center justify-between px-5 py-3.5 text-sm hover:bg-canvas-muted"
                >
                  <div>
                    <p className="font-medium text-ink">{d.title}</p>
                    <p className="text-xs text-ink-muted">
                      {formatMoney(d.amount, d.currency)} · {formatDate(d.updated_at)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-dim" />
                </Link>
              ))
            )}
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Trust score</h2>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-navy-800" />
              <div>
                <p className="font-mono text-3xl font-semibold text-navy-900">
                  {trust ? Math.round(trust.score) : "—"}
                </p>
                <p className="text-xs text-ink-dim">Trust Engine · not AI</p>
              </div>
            </div>
            <Link href="/trust" className="mt-4 inline-block text-sm font-semibold text-navy-900 hover:underline">
              View breakdown
            </Link>
          </Card>

          <h2 className="pt-2 text-sm font-semibold text-ink">AI recommendations</h2>
          <AiInsightCard
            endpoint="merchant-summary"
            body={{
              org_name: orgName,
              trust_score: trust?.score ?? null,
              active_deals: buckets.active.length,
              released_deals: buckets.released.length,
              volume: buckets.volume,
            }}
          />
          <Link href="/ai" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 hover:underline">
            <Sparkles className="h-3.5 w-3.5" />
            Open AI insights hub
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

function BuyerPurchases({
  me,
  deals,
  trust,
  error,
}: {
  me: MeResponse | null;
  deals: Deal[];
  trust: TrustScore | null;
  error: string | null;
}) {
  const userId = me?.user.id;

  const { active, history, cancelCount, refundCount } = useMemo(() => {
    const asBuyer = deals.filter((d) => d.buyer_user_id === userId);
    const pool =
      asBuyer.length > 0 ? asBuyer : deals.filter((d) => d.seller_user_id !== userId);
    return {
      active: pool.filter((d) =>
        (ACTIVE_PURCHASE_STATUSES as readonly string[]).includes(d.status)
      ),
      history: pool.filter((d) =>
        ["released", "cancelled", "expired", "refunded", "refund_pending"].includes(d.status)
      ),
      cancelCount: pool.filter((d) => d.status === "cancelled").length,
      refundCount: pool.filter((d) => d.status === "refunded" || d.status === "refund_pending")
        .length,
    };
  }, [deals, userId]);

  const trustHint = trustHintFromEvents(cancelCount, refundCount);

  return (
    <AppShell>
      <div className="mb-8">
        <p className="section-label">Buyer portal</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900">
          Order management
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Track orders, escrow payment status, and invoices · Trust score{" "}
          <span className="font-mono font-semibold text-navy-900">
            {trust ? Math.round(trust.score) : "—"}
          </span>
        </p>
      </div>

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}
      {trustHint && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {trustHint}
        </Card>
      )}

      <div className="mb-8">
        <EscrowBanner compact />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Active orders</h2>
        {active.length === 0 ? (
          <EmptyState
            title="No active orders"
            description="Open a merchant checkout link or enter a deal code to start."
            icon={<ShoppingBag className="h-6 w-6" />}
            action={
              <Link href="/open" className="btn-primary">
                Enter deal code
              </Link>
            }
          />
        ) : (
          active.map((d, i) => {
            const money = protectionFeeBreakdown(d.amount, d.fee_bps);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="overflow-hidden p-0">
                  <div className="border-b border-line bg-navy-900 px-5 py-4 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/50">
                          Order · {d.public_code}
                        </p>
                        <p className="mt-1 text-lg font-semibold">{d.title}</p>
                        <p className="mt-1 text-xs text-white/60">
                          {formatDate(d.created_at)} · Next: {nextActionLabel(d.status, "buyer")}
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    <div>
                      <p className="section-label mb-2">Order details</p>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">Item price</dt>
                          <dd className="font-mono">{formatMoney(d.amount, d.currency)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">Buyer total</dt>
                          <dd className="font-mono font-semibold">
                            {formatMoney(money.buyerPays, d.currency)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">Seller</dt>
                          <dd className="font-mono text-xs text-ink-dim">
                            {d.seller_user_id?.slice(0, 8) ?? "Merchant"}…
                          </dd>
                        </div>
                      </dl>
                      <PaymentStatusCard status={d.status} />
                    </div>
                    <div>
                      <ProcessSteps
                        title="Order tracking"
                        steps={ORDER_TRACKING_STEPS}
                        currentId={orderTrackingStepId(d.status)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
                    <Link href={dealNextHref(d, true)} className="btn-primary !py-2 text-sm">
                      Continue
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link href={`/deals/${d.id}`} className="btn-secondary !py-2 text-sm">
                      Full order details
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </section>

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-ink">Order history</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((d) => (
              <Link
                key={d.id}
                href={`/deals/${d.id}`}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm transition hover:border-navy-200"
              >
                <div>
                  <p className="font-medium text-ink">{d.title}</p>
                  <p className="text-xs text-ink-dim">
                    {d.public_code} · {formatMoney(d.amount, d.currency)}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

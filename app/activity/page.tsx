"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, getAccessToken, type Deal, type MeResponse } from "@/lib/api";
import { formatDate, STATUS_META } from "@/lib/format";
import { AppShell, Topbar } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function ActivityPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        window.location.href = "/login";
        return;
      }
      try {
        setMe(await api<MeResponse>("/v1/me"));
        setDeals(await api<Deal[]>("/v1/deals"));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const notifications = useMemo(() => {
    const userId = me?.user.id;
    const asBuyer = deals.filter((d) => d.buyer_user_id === userId);
    const pool =
      asBuyer.length > 0 ? asBuyer : deals.filter((d) => d.seller_user_id !== userId);
    return [...pool]
      .flatMap((d) =>
        (d.events ?? []).map((e) => ({
          id: e.id,
          dealTitle: d.title,
          dealId: d.id,
          code: d.public_code,
          to: e.to_state,
          at: e.timestamp,
        }))
      )
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [deals, me]);

  if (loading) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Topbar title="Activity" subtitle="Deal events across your purchases" />

      {notifications.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Events appear when you accept, pay, or confirm a purchase."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-line">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={`/deals/${n.dealId}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition hover:bg-canvas-muted"
              >
                <div>
                  <p className="font-medium text-ink">{n.dealTitle}</p>
                  <p className="text-xs text-ink-muted">
                    {STATUS_META[n.to]?.label ?? n.to} · {n.code}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-dim">{formatDate(n.at)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api, getAccessToken, type Deal, type MeResponse } from "@/lib/api";
import { isMerchantUser } from "@/lib/roles";
import { AppShell, Topbar } from "@/components/AppShell";
import { DealCard } from "@/components/DealCard";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function DealsListPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        window.location.href = "/login";
        return;
      }
      try {
        const me = await api<MeResponse>("/v1/me");
        if (!isMerchantUser(me)) {
          window.location.href = "/dashboard";
          return;
        }
        setDeals(await api<Deal[]>("/v1/deals"));
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

  return (
    <AppShell>
      <Topbar title="Deals" subtitle="All protected deals for your merchant workspace" />

      {deals.length === 0 ? (
        <EmptyState
          title="No deals yet"
          description="Use Create deal in the sidebar to open a protected deal link for your buyer."
          icon={<Plus className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

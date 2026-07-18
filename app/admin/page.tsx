"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getAccessToken, type Deal } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { AppShell, Topbar } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function AdminPage() {
  const { push } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    if (!getAccessToken()) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    try {
      setDeals(await api<Deal[]>("/v1/admin/deals"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin access required (platform org).");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function mockDeliver(id: string) {
    setBusyId(id);
    try {
      await api(`/v1/admin/mock/carrier/${id}/deliver`, { method: "POST" });
      push({ tone: "success", title: "Mock delivery applied" });
      await load();
    } catch (err) {
      push({
        tone: "error",
        title: "Mock deliver failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function forceTransition(id: string, target_state: "released" | "refunded") {
    setBusyId(`${id}-${target_state}`);
    try {
      await api(`/v1/admin/deals/${id}/force-transition`, {
        method: "POST",
        body: JSON.stringify({ target_state }),
      });
      push({ tone: "success", title: `Forced ${target_state}` });
      await load();
    } catch (err) {
      push({
        tone: "error",
        title: "Force transition failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Topbar title="Admin" subtitle="Platform ops · demo recovery tools" />
      {error && (
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}
          <div className="mt-2">
            <span className="sandbox-chip">Sandbox / Development mode</span>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas-muted text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Deal</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link
                      href={`/deals/${d.id}`}
                      className="font-semibold text-ink hover:text-navy-700"
                    >
                      {d.title}
                    </Link>
                    <div className="font-mono text-xs text-ink-dim">{d.public_code}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-soft">
                    {formatMoney(d.amount, d.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-dim">{formatDate(d.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="secondary"
                        className="!py-1.5 text-xs"
                        loading={busyId === d.id}
                        onClick={() => mockDeliver(d.id)}
                      >
                        Mock deliver
                      </Button>
                      <Button
                        variant="ghost"
                        className="!py-1.5 text-xs"
                        loading={busyId === `${d.id}-released`}
                        onClick={() => forceTransition(d.id, "released")}
                      >
                        Force release
                      </Button>
                      <Button
                        variant="ghost"
                        className="!py-1.5 text-xs"
                        loading={busyId === `${d.id}-refunded`}
                        onClick={() => forceTransition(d.id, "refunded")}
                      >
                        Force refund
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {deals.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-dim">
                    No deals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}

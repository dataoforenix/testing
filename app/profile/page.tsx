"use client";

import { useEffect, useState } from "react";
import { api, getAccessToken, type MeResponse } from "@/lib/api";
import { AppShell, Topbar } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!getAccessToken()) {
        window.location.href = "/login";
        return;
      }
      try {
        setMe(await api<MeResponse>("/v1/me"));
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
      <Topbar title="Profile" subtitle="Contact details on file · sandbox verification" />

      <Card className="mx-auto max-w-md p-6">
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Email</dt>
            <dd className="text-right font-medium text-ink">{me?.user.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Phone</dt>
            <dd className="text-right font-medium text-ink">{me?.user.phone_e164 ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Identity</dt>
            <dd className="text-right text-xs text-ink-dim">Sandbox · pending KYC</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-line pt-4">
            <dt className="text-ink-muted">Locale</dt>
            <dd className="text-right text-ink">{me?.user.locale ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-6 text-[11px] leading-relaxed text-ink-dim">
          Sandbox indicators show contact details on file — not verified identity. Trust Scores are
          calculated by the Trust Engine, not by AI.
        </p>
      </Card>
    </AppShell>
  );
}

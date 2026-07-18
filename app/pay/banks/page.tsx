"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { api, getAccessToken, type Deal } from "@/lib/api";
import { authHref, rememberReturnPath } from "@/lib/auth-redirect";
import { SANDBOX_BANKS, featuredBanks } from "@/lib/banks";
import { formatMoney, protectionFeeBreakdown } from "@/lib/format";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

function BanksInner() {
  const router = useRouter();
  const params = useSearchParams();
  const dealId = params.get("deal");
  const code = params.get("code");

  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      if (!code) {
        setError("Missing checkout code");
        setLoading(false);
        return;
      }
      if (!getAccessToken()) {
        const next = `/pay/banks?deal=${dealId ?? ""}&code=${code}`;
        rememberReturnPath(next);
        window.location.href = authHref("/login", next);
        return;
      }
      try {
        const d = await api<Deal>(`/v1/deals/by-code/${code}`, { auth: false });
        if (d.status !== "awaiting_funding") {
          router.replace(`/checkout/${code}`);
          return;
        }
        setDeal(d);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Deal unavailable");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [code, dealId, router]);

  const money = useMemo(
    () => (deal ? protectionFeeBreakdown(deal.amount, deal.fee_bps) : null),
    [deal]
  );

  const banks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? SANDBOX_BANKS
      : SANDBOX_BANKS.filter(
          (b) => b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q)
        );
    // Featured Jordanian partners first
    return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [query]);

  const featured = featuredBanks();

  if (loading) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-lg px-4 py-10">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (!deal || !money || error) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold text-ink">Payment unavailable</h1>
          <p className="mt-2 text-ink-muted">{error}</p>
          {code && (
            <Link href={`/checkout/${code}`} className="btn-secondary mt-6 inline-flex">
              Back to checkout
            </Link>
          )}
        </div>
      </div>
    );
  }

  function continueToBank() {
    if (!selected) return;
    router.push(
      `/pay/authorize?deal=${deal!.id}&code=${deal!.public_code}&bank=${encodeURIComponent(selected)}`
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Nav />
      <div className="mx-auto max-w-lg px-4 pt-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Open Banking</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">
                Choose your bank
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                Authorize payment to our licensed escrow partner via Open Banking. Featured
                connectors: Housing Bank, Capital Bank of Jordan, and Jordan Kuwait Bank.
              </p>
            </div>
            <span className="sandbox-chip shrink-0">Sandbox</span>
          </div>

          <Card className="mb-5 border-brand-200 bg-brand-50/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-800">
              Open Banking architecture
            </p>
            <ol className="mt-2 space-y-1 text-xs text-ink-soft">
              <li>1. Buyer places order</li>
              <li>2. Bank authorization (ASPSPs below)</li>
              <li>3. Money reserved in partner escrow</li>
              <li>4. Seller ships → buyer confirms → release</li>
            </ol>
            <p className="mt-2 text-[11px] text-ink-dim">
              Featured: {featured.map((b) => b.shortName).join(" · ")} · sandbox simulation
            </p>
          </Card>

          <Card className="mb-5 p-4">
            <p className="text-xs text-ink-muted">{deal.title}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-navy-900">
              {formatMoney(money.buyerPays, deal.currency)}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-dim">Total authorization</p>
          </Card>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Jordanian banks…"
              className="input-field !pl-10"
            />
          </div>

          <div className="space-y-2.5">
            {banks.map((bank) => {
              const active = selected === bank.id;
              return (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelected(bank.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all ${
                    active
                      ? "border-navy-900 bg-navy-50 shadow-soft"
                      : "border-line bg-surface hover:border-navy-200 hover:shadow-soft"
                  }`}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-soft"
                    style={{ background: bank.accent }}
                  >
                    {bank.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block text-sm font-semibold text-ink">{bank.name}</span>
                      {bank.featured && (
                        <span className="rounded-md bg-navy-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          Featured
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-dim">
                      Secure Open Banking authorization
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 ${active ? "text-navy-900" : "text-ink-dim"}`}
                  />
                </button>
              );
            })}
            {banks.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-dim">No banks match your search.</p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={!selected}
              onClick={continueToBank}
              className="btn-primary w-full !py-3.5 disabled:opacity-45"
            >
              <Building2 className="h-4 w-4" />
              Continue to bank
            </button>
            <Link href={`/checkout/${code}/pay`} className="btn-ghost w-full text-center">
              Cancel
            </Link>
          </div>

          <p className="mt-6 flex gap-2 text-[11px] leading-relaxed text-ink-dim">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            Simulated Open Banking for demo. Production connects via ProviderEscrowPort — custody
            stays with the licensed partner.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function PayBanksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Nav />
          <div className="mx-auto max-w-lg px-4 py-10">
            <PageSkeleton />
          </div>
        </div>
      }
    >
      <BanksInner />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { api, getAccessToken, type Deal } from "@/lib/api";
import { authHref, rememberReturnPath } from "@/lib/auth-redirect";
import { getSandboxBank } from "@/lib/banks";
import { formatMoney, protectionFeeBreakdown, PROTECTION_FEE_BLURB } from "@/lib/format";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

function AuthorizeInner() {
  const { push } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const bankId = params.get("bank");
  const bank = getSandboxBank(bankId);

  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      if (!code || !bank) {
        setError(!bank ? "Unknown bank" : "Missing checkout code");
        setLoading(false);
        return;
      }
      if (!getAccessToken()) {
        const next = `/pay/authorize?deal=${params.get("deal") ?? ""}&code=${code}&bank=${bankId}`;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, bankId]);

  const money = useMemo(
    () => (deal ? protectionFeeBreakdown(deal.amount, deal.fee_bps) : null),
    [deal]
  );

  async function approve() {
    if (!deal || !code) return;
    setBusy(true);
    try {
      await api(`/v1/deals/${deal.id}/payment-intents`, {
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
      });
      push({
        tone: "info",
        title: "Authorization sent",
        description: "Licensed partner confirming escrow hold…",
      });
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const refreshed = await api<Deal>(`/v1/deals/by-code/${code}`, { auth: false });
        if (refreshed.status === "funded") {
          push({
            tone: "success",
            title: "Payment authorized",
            description: "Funds held by licensed escrow partner",
          });
          router.replace(`/checkout/${code}/waiting`);
          return;
        }
      }
      push({
        tone: "info",
        title: "Almost there",
        description: "Partner confirmation pending",
      });
      router.replace(`/checkout/${code}/waiting`);
    } catch (err) {
      push({
        tone: "error",
        title: "Authorization failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  function deny() {
    if (!code) return;
    router.replace(`/checkout/${code}/pay?denied=1`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8]">
        <div className="mx-auto max-w-md px-4 py-10">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (!deal || !money || !bank || error) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-ink">Authorization unavailable</h1>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          {code && (
            <Link href={`/checkout/${code}`} className="btn-secondary mt-6 inline-flex">
              Back to checkout
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      {/* Bank chrome — looks like a real ASPSP auth page */}
      <header style={{ background: bank.accent }} className="px-4 py-5 text-white shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-sm font-bold backdrop-blur">
              {bank.initials}
            </span>
            <div>
              <p className="text-base font-semibold">{bank.name}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/70">
                Secure Open Banking
              </p>
            </div>
          </div>
          <span className="rounded-full border border-amber-300/50 bg-amber-400/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-50">
            Sandbox
          </span>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md px-4 py-8"
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-700">
            <Lock className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              Payment authorization
            </p>
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
            Confirm payment
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            You are authorizing a payment to Theqa&apos;s licensed escrow partner. Funds will be
            held by the partner until delivery is confirmed — not by Theqa.
          </p>

          <dl className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Merchant / deal</dt>
              <dd className="max-w-[55%] text-right font-medium text-slate-900">{deal.title}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Reference</dt>
              <dd className="font-mono text-xs text-slate-700">{deal.public_code}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
              <dt className="text-slate-500">Item price</dt>
              <dd className="font-mono text-slate-900">
                {formatMoney(money.itemPrice, deal.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Theqa Protection Fee</dt>
              <dd className="font-mono text-slate-900">
                {formatMoney(money.protectionFee, deal.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
              <dt className="font-semibold text-slate-800">Total authorization</dt>
              <dd className="font-mono text-lg font-semibold text-emerald-700">
                {formatMoney(money.buyerPays, deal.currency)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{PROTECTION_FEE_BLURB}</p>

          <div className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Permissions requested
            </p>
            {[
              "Initiate a single payment to the licensed escrow partner",
              "Share payment confirmation reference with Theqa",
              "Do not grant ongoing account access",
            ].map((p) => (
              <p key={p} className="flex gap-2 text-xs text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {p}
              </p>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <p className="flex gap-2">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Payee: Licensed escrow partner (Sandbox) · Purpose: Protected escrow hold
            </p>
          </div>

          <div className="mt-6 grid gap-2">
            <Button
              className="w-full !bg-emerald-700 hover:!bg-emerald-600"
              loading={busy}
              onClick={approve}
            >
              Approve payment
            </Button>
            <Button variant="secondary" className="w-full" disabled={busy} onClick={deny}>
              Cancel
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Simulated bank authorization for demo. No real bank account is accessed.
        </p>
      </motion.main>
    </div>
  );
}

export default function PayAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#eef1f4]">
          <div className="mx-auto max-w-md px-4 py-10">
            <PageSkeleton />
          </div>
        </div>
      }
    >
      <AuthorizeInner />
    </Suspense>
  );
}

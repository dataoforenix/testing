"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { api, getAccessToken, type Deal, type MeResponse } from "@/lib/api";
import { formatMoney, protectionFeeBreakdown } from "@/lib/format";
import { AppShell, Topbar } from "@/components/AppShell";
import { EscrowBanner } from "@/components/EscrowBanner";
import { MoneyBreakdown } from "@/components/MoneyBreakdown";
import { PrimaryCTA, SecondaryCTA } from "@/components/PrimaryCTA";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export default function CreateDealPage() {
  const { push } = useToast();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [amount, setAmount] = useState(50);
  const [feePercent, setFeePercent] = useState(2);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const feeBps = Math.round(feePercent * 100);

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = "/login";
      return;
    }
    void api<MeResponse>("/v1/me")
      .then((res) => {
        if (!res.orgs.some((o) => o.type === "merchant")) {
          window.location.href = "/dashboard";
          return;
        }
        setMe(res);
      })
      .catch(() => {
        window.location.href = "/login";
      });
  }, []);

  const org = me?.orgs.find((o) => o.type === "merchant");
  const preview = useMemo(() => protectionFeeBreakdown(amount || 0, feeBps), [amount, feeBps]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!org) {
      setError("No organization on this account");
      return;
    }
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const deal = await api<Deal>("/v1/deals", {
        method: "POST",
        body: JSON.stringify({
          org_id: org.id,
          title: form.get("title"),
          description: form.get("description") || null,
          amount: Number(form.get("amount")),
          currency: "JOD",
          fulfillment_mode: "standard",
          fee_bps: feeBps,
          fee_payer: "buyer",
        }),
      });
      setCreated(deal);
      push({ tone: "success", title: "Deal created" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create deal");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!created) return;
    const url = created.checkout_url || `${window.location.origin}/checkout/${created.public_code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    push({ tone: "info", title: "Checkout link copied" });
  }

  return (
    <AppShell>
      <Topbar
        title="Create deal"
        subtitle="Generate a checkout link · buyer pays Protection Fee"
      />
      <div className="mb-6">
        <EscrowBanner compact />
      </div>

      <AnimatePresence mode="wait">
        {created ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-md space-y-4"
          >
            <div className="panel p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-ink">Share this link</h2>
              <p className="mt-2 text-sm text-ink-muted">
                {created.title} · buyer pays{" "}
                <span className="font-mono font-semibold text-navy-900">
                  {formatMoney(
                    protectionFeeBreakdown(created.amount, created.fee_bps).buyerPays,
                    created.currency
                  )}
                </span>
              </p>
              <p className="mt-4 break-all rounded-xl border border-line bg-canvas-muted px-3 py-2.5 font-mono text-xs text-ink-soft">
                {created.checkout_url ||
                  `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${created.public_code}`}
              </p>
              <div className="mt-6">
                <PrimaryCTA onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy checkout link"}
                </PrimaryCTA>
              </div>
              <div className="mt-3">
                <SecondaryCTA href={`/deals/${created.id}`}>View deal workspace</SecondaryCTA>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={onSubmit}
            className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
          >
            <Card className="space-y-5 p-6">
              <div>
                <h3 className="text-sm font-semibold text-ink">Deal details</h3>
                <p className="text-xs text-ink-muted">Shown on the buyer checkout</p>
              </div>
              <Field label="Title">
                <Input name="title" required minLength={3} placeholder="Used iPhone 13 · 128GB" />
              </Field>
              <Field label="Description">
                <Textarea name="description" placeholder="Condition, delivery city…" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Item Price (JOD)">
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </Field>
                <Field label="Protection Fee %" hint="Buyer pays on top of item price">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={feePercent}
                    onChange={(e) => setFeePercent(Number(e.target.value))}
                  />
                </Field>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={loading} className="w-full !py-3.5">
                Create protected deal
              </Button>
            </Card>

            <MoneyBreakdown
              itemPrice={preview.itemPrice}
              feeBps={feeBps}
              currency="JOD"
              title="Live preview"
              className="h-fit"
            />
          </motion.form>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

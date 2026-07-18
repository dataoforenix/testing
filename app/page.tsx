"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import { getAccessToken } from "@/lib/api";
import { HeroIllustration } from "@/components/HeroIllustration";
import { Nav } from "@/components/Nav";

const PROCESS = [
  {
    step: "01",
    title: "Share a deal link",
    body: "Merchant creates a protected deal. Buyer opens a stepped checkout.",
  },
  {
    step: "02",
    title: "Review trust & AI",
    body: "Trust Engine and Theqa AI on separate steps — never mixed.",
  },
  {
    step: "03",
    title: "Authorize via Open Banking",
    body: "Buyer chooses a bank and authorizes payment to the escrow partner.",
  },
  {
    step: "04",
    title: "Confirm & release",
    body: "After delivery, funds release to the seller. Theqa never held the money.",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Trust Engine",
    body: "Explainable scores with weighted factors. Built for counterparty confidence.",
  },
  {
    icon: Sparkles,
    title: "Theqa AI",
    body: "Fraud and guidance insights that explain the deal. AI never moves funds.",
  },
  {
    icon: Building2,
    title: "Open Banking + Escrow",
    body: "Payment orchestration to a licensed banking partner. Custody stays with the bank.",
  },
];

export default function LandingPage() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => setAuthed(Boolean(getAccessToken())), []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Nav />

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
            <Lock className="h-3.5 w-3.5" />
            AI-powered Trust Platform
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-navy-900 sm:text-6xl lg:text-[4rem]">
            Theqa
          </h1>
          <p className="mt-4 max-w-lg text-xl font-medium leading-snug text-ink-soft sm:text-2xl">
            Trust sits between buyer and seller.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
            Theqa orchestrates Trust Engine scores, AI insights, and Open Banking payment flows.
            Money is always held by a licensed escrow banking partner — never by Theqa.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={authed ? "/dashboard" : "/portal"}
              className="btn-primary !px-6 !py-3"
            >
              {authed ? "Open dashboard" : "Enter Portal"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/open" className="btn-secondary !px-6 !py-3">
              <Wallet className="h-4 w-4" />
              I have a deal link
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-xs text-ink-muted">
            {["Non-custodial", "Open Banking", "Jordan · JOD"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <HeroIllustration />
        </motion.div>
      </section>

      <section className="border-y border-line bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-xl">
            <p className="section-label">Platform pillars</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
              Built like fintech infrastructure — not a marketplace.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="panel-hover p-7"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-xl">
            <p className="section-label">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
              From deal link to partner-held escrow.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="relative rounded-2xl border border-line bg-surface p-6 shadow-soft"
              >
                <span className="font-mono text-sm font-semibold text-brand-600">{step.step}</span>
                <h3 className="mt-3 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-surface py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-xs font-bold text-white">
                T
              </span>
              <span className="font-semibold text-ink">Theqa</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              AI-powered Trust Platform. Escrow custody by licensed banking partners.
            </p>
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="/login" className="text-ink-muted hover:text-ink">
              Sign in
            </Link>
            <Link href="/register" className="text-ink-muted hover:text-ink">
              Register
            </Link>
            <Link href="/open" className="text-ink-muted hover:text-ink">
              Open deal
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-ink-dim sm:px-6">
          © {new Date().getFullYear()} Theqa. Funds held by licensed escrow partners. Theqa never
          holds customer money.
        </p>
      </footer>
    </div>
  );
}

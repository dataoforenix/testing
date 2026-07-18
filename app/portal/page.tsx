"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Handshake, LogIn, UserPlus, UserRound } from "lucide-react";
import { api, clearTokens, getAccessToken, type MeResponse } from "@/lib/api";
import { isMerchantUser } from "@/lib/roles";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";

/**
 * Access gateway — never open a dashboard until auth is verified.
 * Fixes stale localStorage tokens that previously looked like a logged-in buyer.
 */
export default function PortalPage() {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState<MeResponse | null>(null);

  useEffect(() => {
    async function verify() {
      const token = getAccessToken();
      if (!token) {
        setSession(null);
        setChecking(false);
        return;
      }
      try {
        const me = await api<MeResponse>("/v1/me");
        setSession(me);
      } catch {
        clearTokens();
        setSession(null);
      } finally {
        setChecking(false);
      }
    }
    void verify();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-lg px-4 py-16">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (session) {
    const role = isMerchantUser(session) ? "merchant" : "buyer";
    return (
      <div className="min-h-screen">
        <Nav />
        <div className="mx-auto max-w-md px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-label">Verified session</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">Welcome back</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Signed in as {session.user.email ?? session.user.phone_e164 ?? "account"} · {role}{" "}
              portal
            </p>
            <Link href="/dashboard" className="btn-primary mt-8 w-full !py-3.5">
              Continue to {role === "merchant" ? "merchant" : "buyer"} dashboard
            </Link>
            <button
              type="button"
              className="btn-ghost mt-2 w-full"
              onClick={() => {
                clearTokens();
                window.location.href = "/portal";
              }}
            >
              Sign out and switch account
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-label">Theqa Portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy-900">
            Access your account
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            First-time visitors must sign in or register. Dashboards open only after authentication.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/login" className="panel-hover flex items-center gap-3 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
                <LogIn className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-ink">Login</p>
                <p className="text-xs text-ink-muted">Existing account</p>
              </div>
            </Link>
            <Link href="/register" className="panel-hover flex items-center gap-3 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <UserPlus className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-ink">Register</p>
                <p className="text-xs text-ink-muted">Create a new account</p>
              </div>
            </Link>
          </div>

          <p className="section-label mt-10 mb-3">Choose account type</p>
          <div className="space-y-3">
            <Link
              href="/register?type=individual"
              className="panel-hover flex items-start gap-4 p-5"
            >
              <UserRound className="mt-0.5 h-5 w-5 text-navy-800" />
              <div>
                <p className="font-semibold text-ink">Buyer</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Protected purchases, Open Banking escrow, order tracking.
                </p>
              </div>
            </Link>
            <Link
              href="/register?type=merchant"
              className="panel-hover flex items-start gap-4 p-5"
            >
              <Building2 className="mt-0.5 h-5 w-5 text-navy-800" />
              <div>
                <p className="font-semibold text-ink">Seller / Merchant</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Create deals, ship orders, release partner-held funds.
                </p>
              </div>
            </Link>
            <Card className="flex items-start gap-4 border-dashed p-5 opacity-90">
              <Handshake className="mt-0.5 h-5 w-5 text-ink-dim" />
              <div>
                <p className="font-semibold text-ink">Investor / Partner</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Banking & platform partners use API keys and the platform admin org. Contact
                  Theqa for partner onboarding — not available as self-serve signup yet.
                </p>
                <Link href="/login" className="mt-3 inline-block text-sm font-semibold text-navy-900 hover:underline">
                  Partner already have access? Sign in
                </Link>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

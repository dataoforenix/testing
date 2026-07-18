"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import { MoneyBreakdown } from "@/components/MoneyBreakdown";
import { PrimaryCTA, SecondaryCTA } from "@/components/PrimaryCTA";
import { Button } from "@/components/ui/Button";

export function SuccessCelebration({
  title,
  itemPrice,
  fee,
  feeBps = 0,
  currency = "JOD",
  code,
  role = "buyer",
  onDownload,
}: {
  title: string;
  itemPrice: number;
  fee: number;
  feeBps?: number;
  currency?: string;
  code: string;
  role?: "buyer" | "merchant";
  onDownload?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="panel mx-auto max-w-lg overflow-hidden"
    >
      <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 px-6 py-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.3),transparent_60%)]" />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.08, 1], opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-white shadow-brand"
        >
          <Check className="relative h-9 w-9" strokeWidth={2.5} />
        </motion.div>
        <h1 className="relative mt-6 text-3xl font-semibold tracking-tight text-white">
          Funds released
        </h1>
        <p className="relative mt-2 text-sm text-white/60">
          Licensed partner confirmation ·{" "}
          <span className="font-mono text-brand-300">{code}</span>
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <p className="mb-1 text-sm font-medium text-ink">{title}</p>
          <MoneyBreakdown
            variant="embedded"
            itemPrice={itemPrice}
            feeBps={feeBps}
            feeAmount={fee}
            currency={currency}
            title="Release receipt"
          />
        </div>

        <Button variant="secondary" className="w-full" onClick={onDownload}>
          <Download className="h-4 w-4" />
          Download receipt
        </Button>

        {role === "merchant" ? (
          <>
            <PrimaryCTA href="/deals/new">Create another deal</PrimaryCTA>
            <SecondaryCTA href="/dashboard">Back to overview</SecondaryCTA>
          </>
        ) : (
          <>
            <PrimaryCTA href="/dashboard">Back to purchases</PrimaryCTA>
            <p className="text-center text-xs text-ink-dim">
              Or{" "}
              <Link href="/activity" className="font-medium text-navy-900 hover:underline">
                view activity
              </Link>
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Building2, Lock, Shield, Sparkles } from "lucide-react";

/** Abstract trust-orchestration visual for the landing hero */
export function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 shadow-navy" />
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.25),transparent_50%)]" />
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.12),transparent_45%)]" />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[8%] top-[18%] w-[42%] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 text-brand-300">
          <Shield className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Trust Engine</span>
        </div>
        <p className="mt-3 font-mono text-3xl font-semibold text-white">84</p>
        <p className="mt-1 text-xs text-white/50">Merchant score</p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className="absolute right-[6%] top-[28%] w-[46%] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 text-sky-300">
          <Sparkles className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">AI Insight</span>
        </div>
        <p className="mt-3 text-sm leading-snug text-white/90">
          Low fraud signals. Counterparty looks consistent with prior releases.
        </p>
      </motion.div>

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="absolute bottom-[16%] left-[12%] right-[12%] rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <Lock className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Partner custody
            </span>
          </div>
          <Building2 className="h-4 w-4 text-white/40" />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-white/50">Held in escrow</p>
            <p className="font-mono text-xl font-semibold text-white">JOD 255.00</p>
          </div>
          <span className="rounded-full bg-brand-500/20 px-2.5 py-1 text-[10px] font-semibold text-brand-300">
            Secured
          </span>
        </div>
      </motion.div>
    </div>
  );
}

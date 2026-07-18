"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Circle, Shield } from "lucide-react";
import type { TrustScore } from "@/lib/api";
import { humanizeKey, scoreBand, scoreColor } from "@/lib/format";
import { Card } from "@/components/ui/Card";

const R = 54;
const C = 2 * Math.PI * R;

export type VerificationFlags = {
  email?: boolean;
  phone?: boolean;
  identity?: boolean;
};

function VerificationRow({ flags }: { flags?: VerificationFlags }) {
  const items = [
    {
      key: "identity",
      text: flags?.identity ? "Identity verified" : "Identity · Sandbox · pending KYC",
      verified: Boolean(flags?.identity),
    },
    {
      key: "email",
      text: flags?.email ? "Email on file · Sandbox" : "Email · Pending",
      verified: false,
    },
    {
      key: "phone",
      text: flags?.phone ? "Phone on file · Sandbox" : "Phone · Pending",
      verified: false,
    },
  ];
  return (
    <ul className="mt-4 space-y-2 border-t border-line pt-4">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2 text-xs">
          {item.verified ? (
            <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-ink-dim" />
          )}
          <span className={item.verified ? "text-ink-soft" : "text-ink-dim"}>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function RadialRing({
  score,
  size = 140,
  label,
}: {
  score: number;
  size?: number;
  label: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const colors = scoreColor(score);
  const offset = C - (Math.min(100, Math.max(0, score)) / 100) * C;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#E2E8F0" strokeWidth="10" />
          <motion.circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: mounted ? offset : C }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={score}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-mono text-3xl font-semibold ${colors.text}`}
          >
            {Math.round(score)}
          </motion.span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink-dim">
            {scoreBand(score)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-ink-soft">{label}</p>
    </div>
  );
}

function BuildingPlaceholder({ label, size = 140 }: { label: string; size?: number }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-full border border-dashed border-brand-300 bg-brand-50"
        style={{ width: size, height: size }}
      >
        <div className="px-3 text-center">
          <p className="font-mono text-lg font-semibold text-brand-600">New</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-dim">Building</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-ink-soft">{label}</p>
    </div>
  );
}

export function TrustScoreCard({
  score,
  title = "Trust Score",
  verification,
}: {
  score: TrustScore | null;
  title?: string;
  verification?: VerificationFlags;
}) {
  const hasPriors =
    score && Object.values(score.breakdown).some((p) => p.applied_prior);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-navy-700" />
        <p className="section-label">{title}</p>
      </div>
      <p className="mt-1 text-[11px] text-ink-dim">Calculated by Theqa Trust Engine</p>
      <div className="mt-4 flex justify-center">
        {score ? (
          <RadialRing score={score.score} label={score.entity_type} />
        ) : (
          <BuildingPlaceholder label="Building trust" />
        )}
      </div>
      {!score && (
        <p className="mt-3 text-center text-xs text-ink-muted">
          New accounts are not marked untrusted — your score builds with verified activity.
        </p>
      )}
      {hasPriors && (
        <p className="mt-2 text-center text-[11px] text-ink-dim">Includes cold-start baseline</p>
      )}
      <VerificationRow flags={verification} />
    </Card>
  );
}

export function TrustBreakdown({
  score,
  title = "Score breakdown",
}: {
  score: TrustScore | null;
  title?: string;
}) {
  const entries = useMemo(
    () => (score ? Object.entries(score.breakdown) : []),
    [score]
  );

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Theqa Trust Engine · weighted factors (not AI-calculated)
      </p>

      {!score && (
        <p className="mt-6 text-sm text-ink-dim">
          Breakdown appears once your Trust Engine score is available.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {entries.map(([key, part]) => {
          const colors = scoreColor(part.value);
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-ink-soft">{humanizeKey(key)}</span>
                <span className="font-mono text-ink-muted">
                  {(part.weight * 100).toFixed(0)}% · {part.value.toFixed(0)}
                  {part.applied_prior ? " · prior" : ""}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-canvas-soft">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colors.stroke }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, part.value)}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function DualTrustRadials({
  seller,
  buyer,
  sellerVerification,
  buyerVerification,
}: {
  seller: TrustScore | null;
  buyer: TrustScore | null;
  sellerVerification?: VerificationFlags;
  buyerVerification?: VerificationFlags;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-center gap-2">
        <Shield className="h-4 w-4 text-navy-700" />
        <p className="section-label">Counterparty trust</p>
      </div>
      <p className="mt-1 text-center text-[11px] text-ink-dim">
        Calculated by Theqa Trust Engine — separate from AI insights
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-around gap-6">
        {seller ? (
          <RadialRing score={seller.score} label="Seller" />
        ) : (
          <BuildingPlaceholder label="Seller · Building" />
        )}
        {buyer ? (
          <RadialRing score={buyer.score} label="Buyer" />
        ) : (
          <BuildingPlaceholder label="Buyer · Building" />
        )}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Seller verification
          </p>
          <VerificationRow flags={sellerVerification} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Buyer verification
          </p>
          <VerificationRow flags={buyerVerification} />
        </div>
      </div>
    </Card>
  );
}

"use client";

import { ShieldCheck } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/Card";

export type DealCustody = {
  deal_id: string;
  deal_status: string;
  currency: string;
  custody_notice: string;
  payment_intent?: {
    id: string;
    provider_intent_id: string;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
  } | null;
  escrow_hold?: {
    id: string;
    status: string;
    amount_minor: number;
    fee_minor: number;
    seller_net_minor: number;
    created_at: string;
    updated_at: string;
  } | null;
  ledger_transactions: Array<{ id: string; type: string; created_at: string }>;
};

function minorToMajor(minor: number) {
  return minor / 100;
}

export function CustodyCard({ custody }: { custody: DealCustody | null }) {
  if (!custody) {
    return (
      <Card className="p-5">
        <p className="section-label">Partner custody</p>
        <p className="mt-2 text-sm text-ink-muted">
          No escrow hold yet. Custody appears after Open Banking authorization.
        </p>
      </Card>
    );
  }

  const hold = custody.escrow_hold;
  const intent = custody.payment_intent;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-brand-600" />
        <p className="section-label">Partner custody</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{custody.custody_notice}</p>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">Escrow status</dt>
          <dd className="font-medium capitalize text-ink">{hold?.status ?? "—"}</dd>
        </div>
        {hold && (
          <>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Held (buyer total)</dt>
              <dd className="font-mono text-ink">
                {formatMoney(minorToMajor(hold.amount_minor), custody.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Protection fee (mirror)</dt>
              <dd className="font-mono text-ink">
                {formatMoney(minorToMajor(hold.fee_minor), custody.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Seller net (mirror)</dt>
              <dd className="font-mono text-brand-600">
                {formatMoney(minorToMajor(hold.seller_net_minor), custody.currency)}
              </dd>
            </div>
          </>
        )}
        {intent && (
          <>
            <div className="flex justify-between gap-3 border-t border-line pt-3">
              <dt className="text-ink-muted">Payment intent</dt>
              <dd className="font-mono text-xs text-ink">{intent.status}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Provider ref</dt>
              <dd className="max-w-[55%] truncate font-mono text-[10px] text-ink-dim">
                {intent.provider_intent_id}
              </dd>
            </div>
          </>
        )}
      </dl>

      {custody.ledger_transactions.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="section-label mb-2">Shadow ledger</p>
          <ul className="space-y-1.5 text-xs text-ink-muted">
            {custody.ledger_transactions.map((t) => (
              <li key={t.id} className="flex justify-between gap-2">
                <span className="font-mono">{t.type}</span>
                <span>{formatDate(t.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

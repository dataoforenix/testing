"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Deal } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";

export function DealCard({ deal }: { deal: Deal }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link href={`/deals/${deal.id}`}>
        <Card hover className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold tracking-tight text-ink">{deal.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                {deal.description || "Protected Theqa deal"}
              </p>
            </div>
            <StatusBadge status={deal.status} />
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-dim">Item price</p>
              <p className="mt-1 font-mono text-lg font-semibold text-navy-900">
                {formatMoney(deal.amount, deal.currency)}
              </p>
            </div>
            <div className="text-right text-xs text-ink-dim">
              <div className="font-mono">{deal.public_code}</div>
              <div className="mt-1">{formatDate(deal.created_at)}</div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

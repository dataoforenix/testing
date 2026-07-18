import { Card } from "@/components/ui/Card";

/** Explain how cancellations / disputes affect Trust Score (product copy + event-derived hints). */
export function TrustImpactNotice({
  role,
  scenario,
}: {
  role: "buyer" | "seller";
  scenario: "cancel_early" | "cancel_after_prep" | "seller_fail" | "refund" | "generic";
}) {
  const copy: Record<string, { title: string; body: string }> = {
    cancel_early: {
      title: "Trust impact · early cancel",
      body:
        role === "buyer"
          ? "Cancelling before funding usually has little Trust Score impact. Repeated cancels after accept may lower your score."
          : "Buyer cancelled early. Your Trust Score is typically unaffected.",
    },
    cancel_after_prep: {
      title: "Trust impact · cancel after preparation",
      body:
        "Buyer cancels after seller preparation: buyer Trust Score may decrease slightly. Trust Engine weights cancellation and dispute signals.",
    },
    seller_fail: {
      title: "Trust impact · delivery failure",
      body:
        "Seller fails delivery or faces sustained disputes: seller Trust Score decreases (delivery speed, dispute rate, refund rate).",
    },
    refund: {
      title: "Trust impact · refund",
      body:
        "Refunds update merchant refund_rate and buyer dispute/success signals in the Trust Engine after partner confirmation.",
    },
    generic: {
      title: "How Trust Score changes",
      body:
        role === "buyer"
          ? "Buyer score uses identity, successful transactions, disputes, ratings, and account age. Cancellations and disputes can reduce score."
          : "Seller score uses completed orders, volume, refund rate, dispute rate, and response time.",
    },
  };

  const item = copy[scenario];
  return (
    <Card className="border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-semibold text-amber-900">{item.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-amber-900/80">{item.body}</p>
      <p className="mt-2 text-[10px] text-amber-800/70">
        Calculated by Theqa Trust Engine · AI never changes the score.
      </p>
    </Card>
  );
}

export function trustHintFromEvents(
  cancelledCount: number,
  refundedCount: number
): string | null {
  if (cancelledCount >= 2) {
    return `Your Trust Score may have decreased because you cancelled ${cancelledCount} deals. Trust Engine weights cancellation patterns.`;
  }
  if (refundedCount >= 1) {
    return `Refund activity is reflected in Trust Engine refund/dispute factors after partner confirmation.`;
  }
  return null;
}

"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Truck } from "lucide-react";
import type { Deal, MeResponse } from "@/lib/api";
import { api } from "@/lib/api";
import { nextActionLabel } from "@/lib/roles";
import { PrimaryCTA, SecondaryCTA } from "@/components/PrimaryCTA";
import { TrustImpactNotice } from "@/components/TrustImpactNotice";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const REFUNDABLE = new Set([
  "funded",
  "in_fulfillment",
  "delivery_confirmed",
  "release_pending",
]);

const CANCEL_REASONS = [
  { id: "changed_mind", label: "Changed my mind" },
  { id: "wrong_item", label: "Wrong item / details" },
  { id: "found_better", label: "Found a better option" },
  { id: "seller_delay", label: "Seller not responding" },
  { id: "other", label: "Other" },
];

/**
 * Exactly ONE primary action for the current role + status.
 * Secondary actions (refund/cancel) are demoted.
 */
export function DealActions({
  deal,
  me,
  onUpdated,
}: {
  deal: Deal;
  me: MeResponse;
  onUpdated: () => Promise<void>;
}) {
  const { push } = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("changed_mind");
  const [showMore, setShowMore] = useState(false);

  const isSeller = me.user.id === deal.seller_user_id;
  const isBuyer = me.user.id === deal.buyer_user_id;
  const isParticipant = Boolean(isSeller || isBuyer);
  const role = isSeller ? "seller" : "buyer";

  async function ship(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await api(`/v1/deals/${deal.id}/shipments`, {
        method: "POST",
        body: JSON.stringify({
          carrier: form.get("carrier") || "manual",
          tracking_number: form.get("tracking_number") || null,
        }),
      });
      push({ tone: "success", title: "Marked as shipped" });
      await onUpdated();
    } catch (err) {
      push({
        tone: "error",
        title: "Ship failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelivery() {
    setBusy(true);
    try {
      await api(`/v1/deals/${deal.id}/confirmations`, {
        method: "POST",
        body: JSON.stringify({ notes: "Buyer confirmed receipt" }),
      });
      push({ tone: "success", title: "Delivery verified" });
      await onUpdated();
    } catch (err) {
      push({
        tone: "error",
        title: "Confirm failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  async function release() {
    setBusy(true);
    try {
      await api(`/v1/deals/${deal.id}/release`, { method: "POST" });
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 600));
        const current = await api<Deal>(`/v1/deals/${deal.id}`);
        if (current.status === "released") {
          setConfirmRelease(false);
          router.push(`/deals/${deal.id}/released`);
          return;
        }
      }
      push({ tone: "info", title: "Release pending partner confirmation" });
      await onUpdated();
    } catch (err) {
      push({
        tone: "error",
        title: "Release failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusy(false);
      setConfirmRelease(false);
    }
  }

  async function refund() {
    setBusy(true);
    try {
      await api(`/v1/deals/${deal.id}/refunds`, { method: "POST" });
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 600));
        const current = await api<Deal>(`/v1/deals/${deal.id}`);
        if (current.status === "refunded") {
          setConfirmRefund(false);
          push({
            tone: "success",
            title: "Refund completed",
            description: "Licensed partner returned funds. Theqa never held the money.",
          });
          await onUpdated();
          return;
        }
      }
      push({ tone: "info", title: "Refund pending partner confirmation" });
      await onUpdated();
    } catch (err) {
      push({
        tone: "error",
        title: "Refund failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusy(false);
      setConfirmRefund(false);
    }
  }

  async function cancelDeal() {
    setBusy(true);
    try {
      await api(`/v1/deals/${deal.id}/cancel`, { method: "POST" });
      push({
        tone: "success",
        title: "Deal cancelled",
        description: `Reason: ${CANCEL_REASONS.find((r) => r.id === cancelReason)?.label ?? cancelReason}. Trust Engine may update scores.`,
      });
      setCancelOpen(false);
      await onUpdated();
    } catch (err) {
      push({
        tone: "error",
        title: "Cancel failed",
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setBusy(false);
    }
  }

  let primary: ReactNode = null;

  if (isSeller && deal.status === "funded") {
    primary = (
      <form className="space-y-3" onSubmit={ship}>
        <Field label="Carrier">
          <Input name="carrier" placeholder="Aramex / hand delivery" />
        </Field>
        <Field label="Tracking">
          <Input name="tracking_number" />
        </Field>
        <PrimaryCTA type="submit" loading={busy}>
          <Truck className="h-4 w-4" />
          Mark shipped
        </PrimaryCTA>
      </form>
    );
  } else if (isBuyer && deal.status === "in_fulfillment") {
    primary = (
      <PrimaryCTA loading={busy} onClick={confirmDelivery}>
        <PackageCheck className="h-4 w-4" />
        Confirm delivery
      </PrimaryCTA>
    );
  } else if ((isSeller || isBuyer) && deal.status === "delivery_confirmed") {
    primary = (
      <PrimaryCTA onClick={() => setConfirmRelease(true)}>Release funds</PrimaryCTA>
    );
  } else if (isBuyer && deal.status === "awaiting_funding") {
    primary = (
      <PrimaryCTA href={`/checkout/${deal.public_code}/pay`}>
        Continue to payment
      </PrimaryCTA>
    );
  } else if (deal.status === "draft") {
    primary = (
      <PrimaryCTA href={`/checkout/${deal.public_code}/summary`}>
        {isBuyer ? "Continue checkout" : "Open buyer checkout"}
      </PrimaryCTA>
    );
  } else if (deal.status === "released") {
    primary = (
      <PrimaryCTA href={`/deals/${deal.id}/released`}>View receipt</PrimaryCTA>
    );
  } else {
    primary = (
      <div className="rounded-xl border border-line bg-canvas-muted px-4 py-4 text-sm text-ink-muted">
        <p className="font-medium text-ink">Waiting</p>
        <p className="mt-1">{nextActionLabel(deal.status, role)}</p>
      </div>
    );
  }

  const canRefund = isParticipant && REFUNDABLE.has(deal.status);
  const canCancel =
    isParticipant && ["draft", "awaiting_funding"].includes(deal.status);

  const cancelScenario =
    deal.status === "awaiting_funding" ? "cancel_after_prep" : "cancel_early";

  return (
    <>
      <Card className="space-y-4 p-5">
        <div>
          <p className="section-label">Next step</p>
          <h3 className="mt-1 text-sm font-semibold text-ink">
            {deal.status === "released"
              ? "Completed"
              : nextActionLabel(deal.status, role)}
          </h3>
        </div>
        {primary}

        {(canRefund || canCancel) && (
          <div className="border-t border-line pt-3">
            {!showMore ? (
              <button
                type="button"
                className="text-xs font-medium text-ink-dim hover:text-ink"
                onClick={() => setShowMore(true)}
              >
                More options
              </button>
            ) : (
              <div className="space-y-2">
                {canRefund && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setConfirmRefund(true)}
                  >
                    Request refund
                  </Button>
                )}
                {canCancel && (
                  <SecondaryCTA onClick={() => setCancelOpen(true)}>Cancel order</SecondaryCTA>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmRelease}
        title="Release escrow?"
        description="Asks the licensed escrow partner to pay the seller and remit the Protection Fee. Theqa does not hold funds."
        confirmLabel="Confirm release"
        loading={busy}
        onClose={() => setConfirmRelease(false)}
        onConfirm={release}
      />
      <ConfirmDialog
        open={confirmRefund}
        title="Request refund?"
        description="Asks the licensed escrow partner to return funds to the buyer. Theqa never holds customer money."
        confirmLabel="Confirm refund"
        loading={busy}
        onClose={() => setConfirmRefund(false)}
        onConfirm={refund}
      />

      <Modal open={cancelOpen} title="Cancel order" onClose={() => setCancelOpen(false)}>
        <p className="text-sm text-ink-muted">
          Select a reason. Cancellation is recorded for Trust Engine signals.
        </p>
        <div className="mt-4">
          <Field label="Cancellation reason">
            <select
              className="input-field"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            >
              {CANCEL_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <TrustImpactNotice
            role={role}
            scenario={cancelScenario}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCancelOpen(false)}>
            Keep order
          </Button>
          <Button variant="danger" loading={busy} onClick={cancelDeal}>
            Confirm cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}

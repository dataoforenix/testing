import type { MeResponse, Org } from "@/lib/api";

export type PortalRole = "merchant" | "buyer";

export function isPlatformUser(me: MeResponse | null | undefined): boolean {
  return Boolean(me?.orgs.some((o) => o.type === "platform"));
}

export function isMerchantUser(me: MeResponse | null | undefined): boolean {
  return Boolean(me?.orgs.some((o) => o.type === "merchant"));
}

export function resolvePortalRole(me: MeResponse | null | undefined): PortalRole {
  return isMerchantUser(me) ? "merchant" : "buyer";
}

export function primaryOrg(me: MeResponse | null | undefined): Org | undefined {
  if (!me?.orgs.length) return undefined;
  return me.orgs.find((o) => o.type === "merchant") ?? me.orgs.find((o) => o.type === "platform") ?? me.orgs[0];
}

export function nextActionLabel(status: string, role: "buyer" | "seller"): string {
  if (role === "buyer") {
    switch (status) {
      case "draft":
        return "Accept deal";
      case "awaiting_funding":
        return "Pay securely";
      case "funded":
        return "Waiting for shipment";
      case "in_fulfillment":
        return "Confirm delivery";
      case "delivery_confirmed":
      case "release_pending":
        return "Release in progress";
      case "released":
        return "Completed";
      default:
        return status;
    }
  }
  switch (status) {
    case "draft":
      return "Share checkout link";
    case "awaiting_funding":
      return "Waiting for buyer payment";
    case "funded":
      return "Mark as shipped";
    case "in_fulfillment":
      return "Waiting for buyer confirmation";
    case "delivery_confirmed":
      return "Release funds";
    case "release_pending":
      return "Partner releasing";
    case "released":
      return "Completed";
    default:
      return status;
  }
}

export const ACTIVE_PURCHASE_STATUSES = [
  "draft",
  "awaiting_funding",
  "funded",
  "in_fulfillment",
  "delivery_confirmed",
  "release_pending",
] as const;

export const HISTORY_STATUSES = ["released", "cancelled", "expired", "refunded", "refund_pending"] as const;

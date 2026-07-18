"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getAccessToken, type Deal, type MeResponse, type TrustScore } from "@/lib/api";

type CheckoutContextValue = {
  code: string;
  deal: Deal | null;
  me: MeResponse | null;
  sellerTrust: TrustScore | null;
  buyerTrust: TrustScore | null;
  loggedIn: boolean;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setDeal: (d: Deal) => void;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({
  code,
  children,
}: {
  code: string;
  children: ReactNode;
}) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sellerTrust, setSellerTrust] = useState<TrustScore | null>(null);
  const [buyerTrust, setBuyerTrust] = useState<TrustScore | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const d = await api<Deal>(`/v1/deals/by-code/${code}`, { auth: false });
      setDeal(d);
      setError(null);
      try {
        setSellerTrust(
          await api<TrustScore>(`/v1/trust/scores/merchant/${d.org_id}`, { auth: false })
        );
      } catch {
        setSellerTrust(null);
      }
      if (d.buyer_user_id) {
        try {
          setBuyerTrust(
            await api<TrustScore>(`/v1/trust/scores/individual/${d.buyer_user_id}`, {
              auth: false,
            })
          );
        } catch {
          setBuyerTrust(null);
        }
      } else {
        setBuyerTrust(null);
      }
      if (getAccessToken()) {
        try {
          setMe(await api<MeResponse>("/v1/me"));
          setLoggedIn(true);
        } catch {
          setMe(null);
          setLoggedIn(false);
        }
      } else {
        setMe(null);
        setLoggedIn(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deal not found");
      setDeal(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      code,
      deal,
      me,
      sellerTrust,
      buyerTrust,
      loggedIn,
      loading,
      error,
      reload,
      setDeal,
    }),
    [code, deal, me, sellerTrust, buyerTrust, loggedIn, loading, error, reload]
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout requires CheckoutProvider");
  return ctx;
}

export const CHECKOUT_FLOW_STEPS = [
  { id: "summary", label: "Deal" },
  { id: "trust", label: "Trust" },
  { id: "ai", label: "AI" },
  { id: "confirm", label: "Confirm" },
  { id: "pay", label: "Bank" },
] as const;

export function checkoutStepForStatus(status: string): string {
  if (status === "draft") return "summary";
  if (status === "awaiting_funding") return "confirm";
  return "done";
}

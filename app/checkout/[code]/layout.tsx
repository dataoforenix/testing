"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { CheckoutProvider } from "@/components/checkout/CheckoutContext";
import { Nav } from "@/components/Nav";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ code: string }>();
  const code = params.code;

  return (
    <CheckoutProvider code={code}>
      <div className="min-h-screen pb-16">
        <Nav />
        <div className="mx-auto max-w-lg px-4 pt-2 sm:px-6">{children}</div>
      </div>
    </CheckoutProvider>
  );
}

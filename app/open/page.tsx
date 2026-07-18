"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Nav } from "@/components/Nav";
import { PrimaryCTA } from "@/components/PrimaryCTA";
import { Field, Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export default function OpenDealPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const raw = String(form.get("code") || "").trim();
    if (!raw) {
      setError("Enter a deal code or checkout URL");
      return;
    }
    // Accept full URL or bare public_code
    const match = raw.match(/checkout\/([A-Za-z0-9_-]+)/);
    const code = match?.[1] ?? raw.replace(/[^A-Za-z0-9_-]/g, "");
    if (!code) {
      setError("Could not read a deal code");
      return;
    }
    router.push(`/checkout/${code}/summary`);
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto max-w-md px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-label">Buyer</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">
            Open a deal link
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Paste the checkout URL or public code your merchant shared.
          </p>

          <Card className="mt-6 p-6">
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field label="Deal code or URL">
                <Input
                  name="code"
                  required
                  placeholder="https://…/checkout/ABC123 or ABC123"
                  autoFocus
                />
              </Field>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <PrimaryCTA type="submit">Continue to checkout</PrimaryCTA>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

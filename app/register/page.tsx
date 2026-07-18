"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, User } from "lucide-react";
import { api, setTokens } from "@/lib/api";
import { authHref, resolvePostAuthRedirect } from "@/lib/auth-redirect";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

type RegisterResponse = {
  access_token: string;
  refresh_token: string;
  org: { type: string; name: string };
};

function RegisterInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const typeParam = searchParams.get("type");
  const loginHref = next ? authHref("/login", next) : "/login";

  const { push } = useToast();
  const initialType =
    typeParam === "individual" || typeParam === "buyer"
      ? "individual"
      : typeParam === "merchant" || typeParam === "seller"
        ? "merchant"
        : next
          ? "individual"
          : "merchant";
  const [accountType, setAccountType] = useState<"merchant" | "individual">(initialType);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await api<RegisterResponse>("/v1/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email: form.get("email") || null,
          phone: form.get("phone") || null,
          password: form.get("password"),
          full_name: form.get("full_name"),
          account_type: accountType,
        }),
      });
      setTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
      push({
        tone: "success",
        title: "Account created",
        description: `${res.org.type} workspace ready.`,
      });
      window.location.href = resolvePostAuthRedirect("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto max-w-xl px-4 pb-16 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-6 sm:p-8"
        >
          <p className="section-label">Onboarding</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Open your Theqa account
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Merchants and buyers get completely different experiences.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {(
              [
                {
                  id: "merchant" as const,
                  title: "Merchant",
                  desc: "Sell with protected deals",
                  icon: Building2,
                },
                {
                  id: "individual" as const,
                  title: "Buyer",
                  desc: "Purchase with Open Banking",
                  icon: User,
                },
              ]
            ).map((opt) => {
              const Icon = opt.icon;
              const active = accountType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAccountType(opt.id)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                    active
                      ? "border-navy-900 bg-navy-50 shadow-soft"
                      : "border-line bg-surface hover:border-navy-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-navy-900" : "text-ink-dim"}`} />
                  <p className="mt-2 font-semibold text-ink">{opt.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Full name">
              <Input name="full_name" required placeholder="Sara Ahmad" />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" placeholder="sara@shop.com" />
            </Field>
            <Field label="Phone">
              <Input name="phone" placeholder="+9627..." />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" required minLength={8} />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Create {accountType === "merchant" ? "merchant" : "buyer"} account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-muted">
            Already registered?{" "}
            <Link href={loginHref} className="font-semibold text-navy-900 hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <RegisterInner />
    </Suspense>
  );
}

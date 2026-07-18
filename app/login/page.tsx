"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { api, setTokens, type Tokens } from "@/lib/api";
import { authHref, resolvePostAuthRedirect } from "@/lib/auth-redirect";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

function LoginInner() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const registerHref = next ? authHref("/register", next) : "/register";

  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const tokens = await api<Tokens>("/v1/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email_or_phone: form.get("email_or_phone"),
          password: form.get("password"),
        }),
      });
      setTokens(tokens);
      push({ tone: "success", title: "Welcome back" });
      window.location.href = resolvePostAuthRedirect("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto flex max-w-md flex-col px-4 pb-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-6 sm:p-8"
        >
          <p className="section-label">Secure access</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Sign in to Theqa</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {next
              ? "Sign in to return to your checkout and complete the deal."
              : "Continue to your merchant dashboard or buyer portal."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Email or phone">
              <Input
                name="email_or_phone"
                required
                autoComplete="username"
                placeholder="you@business.com"
              />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">
              Continue
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-ink-muted">
            New here?{" "}
            <Link href={registerHref} className="font-semibold text-navy-900 hover:underline">
              Get Started
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginInner />
    </Suspense>
  );
}

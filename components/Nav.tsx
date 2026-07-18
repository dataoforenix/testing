"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/api";

export function Nav({ mode = "public" }: { mode?: "public" | "app" }) {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getAccessToken()));
  }, []);

  if (mode === "app") return null;

  return (
    <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white shadow-navy">
          T
        </span>
        <span className="text-base font-semibold tracking-tight text-ink">Theqa</span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/open" className="btn-ghost !py-2 hidden sm:inline-flex">
          Deal link
        </Link>
        {/* Portal is the auth gateway — never deep-link guests into a dashboard */}
        <Link href="/portal" className="btn-primary !py-2">
          Portal
        </Link>
        {!hasToken && (
          <Link href="/login" className="btn-ghost !py-2 hidden md:inline-flex">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/** Single primary call-to-action — use exactly one per screen. */
export function PrimaryCTA({
  children,
  href,
  onClick,
  loading,
  type = "button",
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "brand";
  className?: string;
}) {
  const classes = `w-full !py-3.5 ${className}`;
  if (href) {
    return (
      <Link
        href={href}
        className={`${variant === "brand" ? "btn-brand" : "btn-primary"} ${classes}`}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  return (
    <Button type={type} variant={variant} loading={loading} className={classes} onClick={onClick}>
      {children}
    </Button>
  );
}

export function SecondaryCTA({
  children,
  href,
  onClick,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={`btn-ghost w-full text-center ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <Button variant="ghost" className={`w-full ${className}`} onClick={onClick}>
      {children}
    </Button>
  );
}

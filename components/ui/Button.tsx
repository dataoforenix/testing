"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary: "btn-primary",
  brand: "btn-brand",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  accent: "btn-brand",
} as const;

export function Button({
  children,
  variant = "primary",
  className = "",
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`${variants[variant]} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
      )}
      {children}
    </button>
  );
}

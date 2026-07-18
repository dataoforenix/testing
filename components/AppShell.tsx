"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  LayoutDashboard,
  List,
  LogOut,
  Plus,
  Shield,
  ShoppingBag,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { api, clearTokens, getAccessToken, type MeResponse } from "@/lib/api";
import { isPlatformUser, resolvePortalRole, type PortalRole } from "@/lib/roles";

type NavLink = { href: string; label: string; icon: LucideIcon };

function merchantLinks(showAdmin: boolean): NavLink[] {
  const links: NavLink[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/deals", label: "Deals", icon: List },
    { href: "/trust", label: "Trust", icon: Shield },
    { href: "/ai", label: "AI", icon: Sparkles },
  ];
  if (showAdmin) links.push({ href: "/admin", label: "Admin", icon: Shield });
  return links;
}

function buyerLinks(): NavLink[] {
  return [
    { href: "/dashboard", label: "Purchases", icon: ShoppingBag },
    { href: "/activity", label: "Activity", icon: Activity },
    { href: "/trust", label: "Trust", icon: Shield },
    { href: "/ai", label: "AI", icon: Sparkles },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];
}

function linkActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/deals") return pathname === "/deals" || pathname.startsWith("/deals/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function MerchantShell({
  children,
  showAdmin,
}: {
  children: ReactNode;
  showAdmin: boolean;
}) {
  const pathname = usePathname();

  function logout() {
    clearTokens();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-[240px] shrink-0 border-r border-line bg-surface p-4 lg:flex lg:flex-col">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white shadow-navy">
            T
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">Theqa</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-dim">Merchant</div>
          </div>
        </Link>

        <nav className="space-y-1">
          {merchantLinks(showAdmin).map((l) => {
            const Icon = l.icon;
            const active = linkActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-navy-900 text-white shadow-navy"
                    : "text-ink-muted hover:bg-canvas-muted hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <Link href="/deals/new" className="btn-primary w-full !py-2.5 text-sm">
            <Plus className="h-3.5 w-3.5" />
            Create deal
          </Link>
          <div className="rounded-2xl border border-line bg-canvas-muted p-4">
            <p className="text-xs font-semibold text-navy-900">Non-custody</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Licensed partner holds funds. Theqa orchestrates trust and release.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-sm font-semibold text-ink lg:hidden">
            Theqa
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/deals/new" className="btn-primary !py-2 text-xs lg:hidden">
              <Plus className="h-3.5 w-3.5" />
              Create
            </Link>
            <button type="button" className="btn-ghost !py-2 text-xs sm:text-sm" onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 lg:hidden">
          {merchantLinks(showAdmin).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-canvas-muted hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

function BuyerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  function logout() {
    clearTokens();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-canvas via-canvas to-navy-50/40">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-sm font-bold text-white shadow-navy">
              T
            </span>
            <div>
              <div className="text-sm font-semibold text-ink">Theqa</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                Buyer portal
              </div>
            </div>
          </Link>
          <button type="button" className="btn-ghost !py-2 text-xs sm:text-sm" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          {buyerLinks().map((l) => {
            const Icon = l.icon;
            const active = linkActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-navy-900 text-white"
                    : "text-ink-muted hover:bg-canvas-muted hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      setReady(true);
      return;
    }
    void api<MeResponse>("/v1/me")
      .then((res) => {
        setMe(res);
        setReady(true);
      })
      .catch(() => {
        setMe(null);
        setReady(true);
      });
  }, []);

  const role = useMemo(() => resolvePortalRole(me), [me]);
  const showAdmin = isPlatformUser(me);

  if (!ready) {
    return <div className="min-h-screen bg-canvas" />;
  }

  if (role === "merchant") {
    return <MerchantShell showAdmin={showAdmin}>{children}</MerchantShell>;
  }

  return <BuyerShell>{children}</BuyerShell>;
}

export function Sidebar(_props: { role: PortalRole; showAdmin: boolean }) {
  return null;
}

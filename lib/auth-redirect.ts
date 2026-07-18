const RETURN_KEY = "theqa_return_path";

/** Only allow same-origin relative paths (no open redirects). */
export function sanitizeReturnPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.startsWith("/login") || path.startsWith("/register")) return null;
  return path;
}

export function rememberReturnPath(path: string) {
  const safe = sanitizeReturnPath(path);
  if (!safe || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(RETURN_KEY, safe);
  } catch {
    /* ignore */
  }
}

export function consumeReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
  return sanitizeReturnPath(stored);
}

export function authHref(base: "/login" | "/register", nextPath: string) {
  const safe = sanitizeReturnPath(nextPath);
  if (!safe) return base;
  return `${base}?next=${encodeURIComponent(safe)}`;
}

/** Resolve post-auth destination: query `next` → sessionStorage → fallback. */
export function resolvePostAuthRedirect(fallback = "/dashboard"): string {
  if (typeof window === "undefined") return fallback;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = sanitizeReturnPath(params.get("next"));
  if (fromQuery) {
    try {
      sessionStorage.removeItem(RETURN_KEY);
    } catch {
      /* ignore */
    }
    return fromQuery;
  }
  return consumeReturnPath() ?? fallback;
}

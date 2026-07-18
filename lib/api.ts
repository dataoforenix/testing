const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type Tokens = {
  access_token: string;
  refresh_token?: string | null;
};

export type User = {
  id: string;
  email?: string | null;
  phone_e164?: string | null;
  status: string;
  locale: string;
};

export type Org = {
  id: string;
  type: string;
  name: string;
  slug?: string | null;
  status: string;
};

export type MeResponse = {
  user: User;
  orgs: Org[];
};

export type DealEvent = {
  id: string;
  deal_id?: string;
  actor_id?: string | null;
  from_state?: string | null;
  to_state: string;
  metadata_payload?: Record<string, unknown> | null;
  timestamp: string;
};

export type Deal = {
  id: string;
  public_code: string;
  org_id: string;
  seller_user_id?: string | null;
  buyer_user_id?: string | null;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: string;
  fulfillment_mode: string;
  fee_bps: number;
  fee_payer: string;
  net_amount?: number | null;
  fee_amount?: number | null;
  version: number;
  created_at: string;
  updated_at: string;
  events?: DealEvent[];
  participants?: Array<{
    id: string;
    user_id?: string | null;
    org_id?: string | null;
    role: string;
    joined_at?: string;
  }>;
  checkout_url?: string | null;
};

export type TrustScore = {
  id: string;
  entity_type: string;
  entity_id: string;
  score: number;
  breakdown: Record<
    string,
    {
      weight: number;
      value: number;
      contribution: number;
      raw_value?: number | null;
      applied_prior?: boolean;
    }
  >;
  last_calculated_at: string;
};

const ACCESS_KEY = "theqa_access_token";
const REFRESH_KEY = "theqa_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const detail =
      typeof body === "object" && body && "detail" in body
        ? typeof (body as { detail: unknown }).detail === "string"
          ? (body as { detail: string }).detail
          : JSON.stringify((body as { detail: unknown }).detail)
        : `Request failed (${status})`;
    super(detail);
    this.status = status;
    this.body = body;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = (await res.json()) as Tokens;
      setTokens({ access_token: data.access_token, refresh_token: refresh });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean; idempotencyKey?: string; _retried?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const useAuth = options.auth !== false;
  if (useAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (res.status === 401 && useAuth && !options._retried) {
    const ok = await tryRefreshAccessToken();
    if (ok) {
      return api<T>(path, { ...options, _retried: true });
    }
  }

  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export { API_URL };

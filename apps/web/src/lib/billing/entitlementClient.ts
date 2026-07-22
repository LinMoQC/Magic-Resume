import type { Entitlement } from "./types";

const FRESH_MS = 30_000;
const STALE_FALLBACK_MS = 5 * 60_000;
const REQUEST_TIMEOUT_MS = 6_000;

let cache: { value: Entitlement; fetchedAt: number } | null = null;
let inFlight: Promise<Entitlement> | null = null;

export function peekEntitlement(): Entitlement | null {
  return cache?.value ?? null;
}

export function invalidateEntitlementCache() {
  cache = null;
}

/**
 * Shared client-side entitlement request used by both the model picker and the
 * send path. It deduplicates concurrent calls and keeps a short stale fallback
 * so opening the picker never waits indefinitely on the billing stack.
 */
export async function fetchEntitlement(options: { force?: boolean } = {}) {
  const now = Date.now();
  const age = cache ? now - cache.fetchedAt : Number.POSITIVE_INFINITY;
  if (!options.force && cache && age < FRESH_MS) return cache.value;
  if (inFlight) return inFlight;

  const stale =
    !options.force && cache && age < STALE_FALLBACK_MS ? cache.value : null;
  inFlight = requestEntitlement()
    .then((value) => {
      cache = { value, fetchedAt: Date.now() };
      return value;
    })
    .catch((error) => {
      if (stale) return stale;
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

async function requestEntitlement(): Promise<Entitlement> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch("/api/billing/ai-entitlement", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      const message = await readEntitlementError(response);
      throw new Error(message || `账户额度检查失败（${response.status}）`);
    }
    return unwrapEntitlement(await response.json());
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("账户额度检查超时");
    }
    if (error instanceof Error) throw error;
    throw new Error("账户额度检查失败");
  } finally {
    window.clearTimeout(timer);
  }
}

function unwrapEntitlement(payload: unknown): Entitlement {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: unknown }).data &&
    typeof (payload as { data?: unknown }).data === "object"
  ) {
    return (payload as { data: Entitlement }).data;
  }
  return payload as Entitlement;
}

async function readEntitlementError(response: Response) {
  try {
    const data = await response.json();
    return String(data?.errorMessage ?? data?.message ?? data?.error ?? "");
  } catch {
    return "";
  }
}

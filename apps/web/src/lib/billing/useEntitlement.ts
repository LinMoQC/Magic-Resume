"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entitlement } from "./types";
import { fetchEntitlement, peekEntitlement } from "./entitlementClient";

/**
 * Reads the current user's entitlement + day/week usage from the existing
 * `/api/billing/ai-entitlement` route (no new endpoint). Fetches on mount and
 * exposes `refresh()` so callers can revalidate on modal-open / after a send.
 */
export function useEntitlement(enabled = true) {
  const [data, setData] = useState<Entitlement | null>(() => peekEntitlement());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(!peekEntitlement());
    setError(null);
    try {
      setData(await fetchEntitlement());
    } catch (e) {
      setError(e instanceof Error ? e.message : "额度查询失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { data, loading, error, refresh };
}

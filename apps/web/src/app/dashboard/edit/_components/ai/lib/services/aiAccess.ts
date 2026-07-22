import { useSettingStore } from "@/store/useSettingStore";
import {
  fetchEntitlement,
  invalidateEntitlementCache,
} from "@/lib/billing/entitlementClient";
import type { Entitlement } from "@/lib/billing/types";
import type { AgentLlmConfig } from "./types";

export type AiEntitlement = Entitlement;

export type AiAccessResult =
  | { ok: true; config: AgentLlmConfig; entitlement?: AiEntitlement }
  | {
      ok: false;
      reason: "custom_config_required" | "entitlement_unavailable";
      entitlement?: AiEntitlement;
      message?: string;
    };

export async function resolveAiAccessConfig(
  options: { forceRefresh?: boolean } = {},
): Promise<AiAccessResult> {
  const settings = useSettingStore.getState();
  const hasByok = settings.hasLlmConfig();
  const pref = settings.preferredSource;

  const byokConfig = (entitlement?: AiEntitlement): AiAccessResult => ({
    ok: true,
    config: {
      source: "byok",
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      modelName: settings.model,
      maxTokens: settings.maxTokens,
      effort: settings.strength,
    },
    ...(entitlement ? { entitlement } : {}),
  });

  // Explicit BYOK with a valid config uses the user's own key — it never touches
  // internal credits, so skip the /ai-entitlement round-trip entirely (this also
  // lets BYOK keep working when that endpoint is unavailable / the user is logged out).
  if (pref === "byok" && hasByok) return byokConfig();

  let entitlement: AiEntitlement;
  try {
    entitlement = await getAiEntitlement(options.forceRefresh);
  } catch (error) {
    // Entitlement check failed — degrade to the user's own key if they have one,
    // otherwise surface the error.
    if (hasByok) return byokConfig();
    const message = error instanceof Error ? error.message : "账户额度检查失败";
    return { ok: false, reason: "entitlement_unavailable", message };
  }

  const canInternal = Boolean(entitlement.canUseInternal);

  // No hard-coded backend default: send the user's picked model, else fall back to
  // the first offered model. modelName is only omitted when we truly have neither.
  const internalModel =
    settings.selectedModel || entitlement.availableModels?.[0];
  const internalConfig = (): AiAccessResult => ({
    ok: true,
    config: {
      source: "internal",
      ...(internalModel ? { modelName: internalModel } : {}),
      effort: settings.strength,
    },
    entitlement,
  });

  if (pref === "internal" && canInternal) return internalConfig();

  // Auto: internal when entitled, else the user's own key, else prompt to configure.
  if (canInternal) return internalConfig();
  if (hasByok) return byokConfig(entitlement);

  return { ok: false, reason: "custom_config_required", entitlement };
}

export function invalidateAiEntitlement() {
  invalidateEntitlementCache();
}

export function isQuotaOrCustomConfigError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /insufficient_quota|insufficient quota|额度不足|quota|402/i.test(
    message,
  );
}

async function getAiEntitlement(forceRefresh = false): Promise<AiEntitlement> {
  return fetchEntitlement({ force: forceRefresh });
}

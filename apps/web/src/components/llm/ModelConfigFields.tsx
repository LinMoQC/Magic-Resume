"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  PlugZap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { useSettingStore } from '@/store/useSettingStore';
import { MODEL_PROVIDERS, getProvider, CUSTOM_PROVIDER_ID } from '@/lib/constants/modals';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TestState = 'idle' | 'testing' | 'ok' | 'error';

/** Provider ids that have a brand mark under /public/providers/{id}.svg. */
const PROVIDER_LOGO_IDS = new Set(['openai', 'anthropic', 'google', 'deepseek']);

/**
 * Ink for a provider mark. OpenAI's current logo is monochrome — its legacy green
 * reads wrong on the dark surface — so it takes a neutral tint; the rest keep their
 * brand hue.
 */
function providerLogoColor(id: string, brandColor: string): string {
  return id === 'openai' ? '#e5e5e5' : brandColor;
}

/**
 * Brand logo beside a provider name. The SVG lives as a static asset in
 * /public/providers and is tinted here via CSS mask, so no markup is inlined and
 * the color stays data-driven. Providers without a mark fall back to a generic glyph.
 */
function ProviderLogo({ id, color }: { id: string; color: string }) {
  if (!PROVIDER_LOGO_IDS.has(id)) {
    return <Boxes className="h-4 w-4 shrink-0 text-neutral-400" />;
  }
  const mask = `url(/providers/${id}.svg) center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      style={{ backgroundColor: providerLogoColor(id, color), mask, WebkitMask: mask }}
    />
  );
}

/**
 * Provider-first LLM config fields, bound directly to {@link useSettingStore}.
 * Shared by the settings page and the in-chat config gate so the catalog +
 * store-setter logic lives in exactly one place. Callers own save/chrome.
 */
export function ModelConfigFields() {
  const { t } = useTranslation();
  const {
    provider,
    apiKey,
    baseUrl,
    model,
    maxTokens,
    setProvider,
    setApiKey,
    setBaseUrl,
    setModel,
    setMaxTokens,
  } = useSettingStore();

  const meta = getProvider(provider);
  const isCustom = provider === CUSTOM_PROVIDER_ID;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Custom needs base URL up front; presets keep Base URL / Max Tokens tucked away.
  const showAdvanced = advancedOpen || isCustom;

  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const [testMsg, setTestMsg] = useState('');
  const canTest = Boolean(apiKey?.trim() && baseUrl?.trim() && model?.trim());

  // Any change to the connection inputs invalidates a prior test result.
  useEffect(() => {
    setTestState('idle');
    setTestMsg('');
  }, [provider, apiKey, baseUrl, model]);

  const handleTest = async () => {
    setTestState('testing');
    setTestMsg('');
    try {
      const res = await fetch('/api/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, baseUrl, apiKey, model }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; latencyMs?: number };
      if (data.ok) {
        setTestState('ok');
        setTestMsg(typeof data.latencyMs === 'number' ? `${data.latencyMs}ms` : '');
      } else {
        setTestState('error');
        setTestMsg(data.message || '');
      }
    } catch {
      setTestState('error');
      setTestMsg('');
    }
  };

  const inputClass =
    'h-11 rounded-xl border-white/[0.08] bg-black/25 text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all placeholder:text-neutral-700 focus-visible:ring-sky-500/30 focus-visible:ring-offset-0';
  const selectTriggerClass =
    'h-11 w-full rounded-xl border-white/[0.08] bg-black/25 text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition-all focus:ring-sky-500/30';

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {/* Provider + Model on one row — both are short selects, so this fills the
          width and keeps the form compact instead of a sparse vertical stack. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-neutral-300">
            {t('settings.llm.providerLabel')}
          </label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className={selectTriggerClass}>
              <SelectValue placeholder={t('settings.llm.providerPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/[0.08] bg-neutral-950 text-white shadow-2xl shadow-black/50">
              {MODEL_PROVIDERS.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                  className="rounded-lg transition-colors focus:bg-white/[0.06] focus:text-sky-300"
                >
                  <ProviderLogo id={p.id} color={p.brandColor} />
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-[13px] font-medium text-neutral-300">
            {t('settings.llm.modelLabel')}
          </label>
          {isCustom ? (
            <Input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t('settings.llm.modelCustomPlaceholder')}
              className={inputClass}
            />
          ) : (
            <Select value={model} onValueChange={setModel} disabled={!meta}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue
                  placeholder={
                    meta
                      ? t('settings.llm.modelPlaceholder')
                      : t('settings.llm.selectProviderFirst')
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/[0.08] bg-neutral-950 text-white shadow-2xl shadow-black/50">
                {meta?.models.map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                    className="rounded-lg transition-colors focus:bg-white/[0.06] focus:text-sky-300"
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* API key + connection test side by side — keeps the key input a sane width
          in a wide card instead of stretching it across the whole row. */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
            <label
              htmlFor="apiKey"
              className="flex items-center gap-2 text-[13px] font-medium text-neutral-300"
            >
              <LockClosedIcon className="w-3.5 h-3.5" />
              {t('settings.llm.apiKeyLabel')}
            </label>
            {meta?.keyUrl && (
              <a
                href={meta.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-300 transition-colors hover:text-sky-200"
              >
                {t('settings.llm.getKeyLink')}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="relative">
            <Input
              id="apiKey"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={'sk-...'}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? t('settings.llm.hideKey') : t('settings.llm.showKey')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="min-w-0 space-y-2">
          <span className="block min-h-[1.25rem]" aria-hidden="true" />
          <div className="flex h-11 min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={!canTest || testState === 'testing'}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-xs font-medium text-neutral-300 transition-colors hover:border-sky-400/20 hover:bg-sky-400/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {testState === 'testing' ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <PlugZap size={13} />
              )}
              {testState === 'testing' ? t('settings.llm.testing') : t('settings.llm.testConnection')}
            </button>
            {testState === 'ok' && (
              <span className="text-xs inline-flex items-center gap-1 text-emerald-400 truncate">
                <CheckCircle2 size={14} className="shrink-0" />
                {testMsg || t('settings.llm.testConnected')}
              </span>
            )}
            {testState === 'error' && (
              <span
                className="text-xs inline-flex items-center gap-1 text-red-400 min-w-0"
                title={testMsg}
              >
                <XCircle size={14} className="shrink-0" />
                <span className="truncate">{t('settings.llm.testFailed')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Advanced — Base URL + Max Tokens, prefilled. Collapsed for presets. */}
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        {!isCustom && (
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
            {t('settings.llm.advanced')}
          </button>
        )}
        <AnimatePresence initial={false}>
          {showAdvanced && (
            <motion.div
              key="advanced"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <label htmlFor="baseUrl" className="text-[13px] font-medium text-neutral-300">
                  {t('settings.llm.baseUrlLabel')}
                </label>
                <Input
                  id="baseUrl"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={'https://api.openai.com/v1'}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="maxTokens" className="text-[13px] font-medium text-neutral-300">
                  {t('settings.llm.maxTokensLabel')}
                </label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={maxTokens}
                  min={1024}
                  max={65536}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  placeholder="8192"
                  className={inputClass}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

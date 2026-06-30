"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
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

/** Small brand-colored dot shown beside a provider name. */
function ProviderDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}66` }}
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
    'bg-neutral-950/50 border-neutral-800 focus:ring-sky-500/50 transition-all placeholder:text-neutral-600';

  return (
    <div className="space-y-4">
      {/* Provider + Model on one row — both are short selects, so this fills the
          width and keeps the form compact instead of a sparse vertical stack. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300">
            {t('settings.llm.providerLabel')}
          </label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="bg-neutral-950/50 border-neutral-800">
              <SelectValue placeholder={t('settings.llm.providerPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
              {MODEL_PROVIDERS.map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                  className="focus:bg-neutral-800 focus:text-sky-400 transition-colors"
                >
                  <ProviderDot color={p.brandColor} />
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-neutral-300">
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
              <SelectTrigger className="bg-neutral-950/50 border-neutral-800">
                <SelectValue
                  placeholder={
                    meta
                      ? t('settings.llm.modelPlaceholder')
                      : t('settings.llm.selectProviderFirst')
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                {meta?.models.map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                    className="focus:bg-neutral-800 focus:text-sky-400 transition-colors"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
            <label
              htmlFor="apiKey"
              className="text-sm font-medium text-neutral-300 flex items-center gap-2"
            >
              <LockClosedIcon className="w-3.5 h-3.5" />
              {t('settings.llm.apiKeyLabel')}
            </label>
            {meta?.keyUrl && (
              <a
                href={meta.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1"
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
              placeholder="sk-..."
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

        <div className="space-y-2 min-w-0">
          <span className="block min-h-[1.25rem]" aria-hidden="true" />
          <div className="flex items-center gap-2 h-9 min-w-0">
            <button
              type="button"
              onClick={handleTest}
              disabled={!canTest || testState === 'testing'}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900/60 h-9 px-3 text-xs text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
      <div className="pt-0.5">
        {!isCustom && (
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="text-xs text-neutral-400 hover:text-neutral-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
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
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3"
            >
              <div className="space-y-2">
                <label htmlFor="baseUrl" className="text-sm font-medium text-neutral-300">
                  {t('settings.llm.baseUrlLabel')}
                </label>
                <Input
                  id="baseUrl"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="maxTokens" className="text-sm font-medium text-neutral-300">
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

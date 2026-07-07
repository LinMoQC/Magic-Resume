"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppAuth } from '@/lib/auth';
import { Check, Copy, KeyRound, RefreshCw, Terminal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { resumeApi } from '@/lib/api/resume';
import { mcpApi, PersonalAccessToken } from '@/lib/api/mcp';
import {
  formatMcpDate,
  getApiErrorMessage,
  getMcpApiUrl,
  normalizeCloudResumes,
  shellQuote,
  type CloudResumeOption,
} from '@/lib/settings/mcpAccess';

export function McpAccessSection({ showHeader = true }: { showHeader?: boolean } = {}) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { isSignedIn } = useAppAuth();
  const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
  const [resumes, setResumes] = useState<CloudResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [newTokenName, setNewTokenName] = useState('Magic Resume MCP');
  const [plainToken, setPlainToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const mcpApiUrl = useMemo(() => getMcpApiUrl(), []);
  const mcpCommand = useMemo(() => {
    if (!plainToken) return '';
    const resumeArg = selectedResumeId ? ` --default-resume-id ${shellQuote(selectedResumeId)}` : '';
    return `npx -y @magic-resume/mcp config set --api-url ${shellQuote(mcpApiUrl)} --pat ${shellQuote(plainToken)}${resumeArg}\nclaude mcp add magic-resume -- npx -y @magic-resume/mcp mcp`;
  }, [mcpApiUrl, plainToken, selectedResumeId]);

  const loadMcpAccess = useCallback(async () => {
    if (!isSignedIn) return;

    setIsLoading(true);
    try {
      const [nextTokens, cloudResult] = await Promise.all([
        mcpApi.listPersonalAccessTokens(),
        resumeApi.fetchCloudResumes(),
      ]);
      const cloudResumes = normalizeCloudResumes(cloudResult);
      setTokens(nextTokens);
      setResumes(cloudResumes);
      setSelectedResumeId((current) => current || cloudResumes[0]?.id || '');
    } catch (error) {
      console.error('Failed to load MCP access:', error);
      toast.error(getApiErrorMessage(error) || t('settings.mcp.notifications.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, t]);

  useEffect(() => {
    loadMcpAccess();
  }, [loadMcpAccess]);

  const handleCreateToken = async () => {
    if (!isSignedIn) {
      toast.error(t('settings.mcp.notifications.signInRequired'));
      return;
    }

    setIsCreating(true);
    try {
      const created = await mcpApi.createPersonalAccessToken({
        name: newTokenName.trim() || 'Magic Resume MCP',
      });
      setPlainToken(created.token);
      setTokens((current) => [created, ...current]);
      toast.success(t('settings.mcp.notifications.created'));
    } catch (error) {
      console.error('Failed to create MCP token:', error);
      toast.error(getApiErrorMessage(error) || t('settings.mcp.notifications.createFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!isSignedIn) {
      toast.error(t('settings.mcp.notifications.signInRequired'));
      return;
    }

    try {
      const revoked = await mcpApi.revokePersonalAccessToken(tokenId);
      setTokens((current) => current.map((item) => (item.id === tokenId ? revoked : item)));
      toast.success(t('settings.mcp.notifications.revoked'));
    } catch (error) {
      console.error('Failed to revoke MCP token:', error);
      toast.error(getApiErrorMessage(error) || t('settings.mcp.notifications.revokeFailed'));
    }
  };

  const copyText = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(t('settings.mcp.notifications.copied'));
    window.setTimeout(() => setCopiedKey(null), 1600);
  };

  const activeCount = tokens.filter((token) => !token.revokedAt).length;

  const inputClass =
    'h-10 rounded-lg border border-white/[0.07] bg-sunk px-3.5 text-neutral-100 placeholder:text-neutral-600 transition-colors focus-visible:border-sky-500/40 focus-visible:ring-1 focus-visible:ring-sky-500/25 focus-visible:ring-offset-0';

  return (
    <section id="mcp-access" className="mx-auto max-w-[760px]">
      {showHeader && (
        <header className="mb-8">
          <h2 className="text-[22px] font-semibold tracking-tight text-neutral-50">{t('settings.mcp.title')}</h2>
          <p className="mt-2 max-w-[58ch] text-[13px] leading-relaxed text-neutral-500">
            {t('settings.mcp.description')}
          </p>
        </header>
      )}

      {/* Connect console — name + default resume + create, one focused surface */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,190px)_auto]">
          <Input
            value={newTokenName}
            onChange={(event) => setNewTokenName(event.target.value)}
            placeholder={t('settings.mcp.tokenNamePlaceholder')}
            className={inputClass}
          />
          <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
            <SelectTrigger className="h-10 w-full rounded-lg border border-white/[0.07] bg-sunk px-3.5 text-neutral-100 transition-colors data-[size=default]:h-10 data-[placeholder]:text-neutral-500 focus-visible:border-sky-500/40 focus-visible:ring-1 focus-visible:ring-sky-500/25">
              <SelectValue placeholder={t('settings.mcp.defaultResumePlaceholder')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/[0.08] bg-neutral-950 text-white shadow-2xl shadow-black/50">
              {resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id} className="rounded-lg focus:bg-white/[0.06] focus:text-sky-300">
                  {resume.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleCreateToken}
            loading={isCreating}
            disabled={!isSignedIn}
            className="h-10 rounded-lg bg-sky-500 px-5 text-sm font-medium text-[#fff] transition-colors hover:bg-sky-400 focus-visible:ring-sky-400/50"
          >
            {t('settings.mcp.enable')}
          </Button>
        </div>
        {!plainToken && (
          <p className="mt-3.5 flex items-center gap-2 text-[12px] leading-relaxed text-neutral-500">
            <Terminal className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
            {t('settings.mcp.commandEmpty')}
          </p>
        )}
      </div>

      {/* Payoff — the one-time token + paste-ready command, only after creation */}
      <AnimatePresence initial={false}>
        {plainToken && (
          <motion.div
            key="mcp-reveal"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 space-y-5 rounded-2xl border border-sky-400/25 bg-sky-400/[0.05] p-4 sm:p-5"
          >
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sky-100">{t('settings.mcp.tokenCreatedTitle')}</p>
                  <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-sky-100/70">{t('settings.mcp.tokenCreatedDescription')}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => copyText(plainToken, 'token')}
                  className="shrink-0 rounded-lg bg-sky-500 text-[#fff] hover:bg-sky-400"
                >
                  {copiedKey === 'token' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {t('settings.mcp.copyToken')}
                </Button>
              </div>
              <div className="mt-3 break-all rounded-lg border border-sky-400/15 bg-sunk p-3 font-mono text-xs text-sky-100">
                {plainToken}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-neutral-200">
                  <Terminal className="h-4 w-4 text-sky-300" />
                  <p className="text-[13px] font-medium">{t('settings.mcp.commandTitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(mcpCommand, 'command')}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {copiedKey === 'command' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {t('settings.mcp.copyCommand')}
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-sunk p-3.5 font-mono text-xs leading-relaxed text-neutral-300">
                {mcpCommand}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tokens management */}
      <div className="mt-8">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <p className="text-[13px] font-medium text-neutral-300">{t('settings.mcp.activeTokens')}</p>
            <span className="font-mono text-xs tabular-nums text-neutral-600">{activeCount}</span>
          </div>
          <button
            type="button"
            onClick={loadMcpAccess}
            disabled={isLoading}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-neutral-400 transition-colors hover:bg-white/[0.05] hover:text-neutral-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {t('settings.mcp.refresh')}
          </button>
        </div>
        {tokens.length === 0 ? (
          <div className="flex items-center gap-2.5 py-5 text-sm text-neutral-500">
            <KeyRound className="h-4 w-4 shrink-0 text-neutral-600" />
            {t('settings.mcp.emptyTokens')}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex flex-col gap-3 py-3.5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-neutral-100">{token.name}</p>
                    <span
                      className={
                        token.revokedAt
                          ? 'rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300'
                          : 'rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300'
                      }
                    >
                      {token.revokedAt ? t('settings.mcp.revoked') : t('settings.mcp.active')}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-neutral-500">{token.tokenPreview}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="whitespace-nowrap text-xs text-neutral-500">
                    {token.lastUsedAt ? t('settings.mcp.lastUsed', { date: formatMcpDate(token.lastUsedAt) }) : t('settings.mcp.neverUsed')}
                  </p>
                  <Button
                    type="button"
                    size="icon"
                    disabled={Boolean(token.revokedAt)}
                    onClick={() => handleRevokeToken(token.id)}
                    className="h-9 w-9 rounded-full bg-white/[0.04] text-neutral-400 hover:bg-red-500/15 hover:text-red-200"
                    aria-label={t('settings.mcp.revoke')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

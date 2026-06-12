"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Check, Copy, KeyRound, Plus, RefreshCw, Terminal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
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

type CloudResumeOption = {
  id: string;
  title: string;
};

export function McpAccessSection() {
  const { t } = useTranslation();
  const { getToken, isSignedIn } = useAuth();
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

    const clerkToken = await getToken();
    if (!clerkToken) {
      toast.error(t('settings.mcp.notifications.signInRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const [nextTokens, cloudResult] = await Promise.all([
        mcpApi.listPersonalAccessTokens(clerkToken),
        resumeApi.fetchCloudResumes(clerkToken),
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
  }, [getToken, isSignedIn, t]);

  useEffect(() => {
    loadMcpAccess();
  }, [loadMcpAccess]);

  const handleCreateToken = async () => {
    if (!isSignedIn) {
      toast.error(t('settings.mcp.notifications.signInRequired'));
      return;
    }

    const clerkToken = await getToken();
    if (!clerkToken) {
      toast.error(t('settings.mcp.notifications.signInRequired'));
      return;
    }

    setIsCreating(true);
    try {
      const created = await mcpApi.createPersonalAccessToken({
        name: newTokenName.trim() || 'Magic Resume MCP',
      }, clerkToken);
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

    const clerkToken = await getToken();
    if (!clerkToken) {
      toast.error(t('settings.mcp.notifications.signInRequired'));
      return;
    }

    try {
      const revoked = await mcpApi.revokePersonalAccessToken(tokenId, clerkToken);
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

  return (
    <section id="mcp-access">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
        {t('settings.mcp.title')}
      </h2>

      <div className="border border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-neutral-100">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold">{t('settings.mcp.accessTitle')}</h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
                {t('settings.mcp.description')}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadMcpAccess}
              loading={isLoading}
              className="shrink-0 rounded-full border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('settings.mcp.refresh')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px_auto] gap-3">
            <Input
              value={newTokenName}
              onChange={(event) => setNewTokenName(event.target.value)}
              placeholder={t('settings.mcp.tokenNamePlaceholder')}
              className="bg-neutral-950/50 border-neutral-800 focus:ring-emerald-500/50"
            />
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger className="bg-neutral-950/50 border-neutral-800">
                <SelectValue placeholder={t('settings.mcp.defaultResumePlaceholder')} />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                {resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id} className="focus:bg-neutral-800 focus:text-emerald-400">
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
              className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('settings.mcp.enable')}
            </Button>
          </div>

          {plainToken && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-200">{t('settings.mcp.tokenCreatedTitle')}</p>
                  <p className="text-xs text-emerald-100/70 mt-1">{t('settings.mcp.tokenCreatedDescription')}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => copyText(plainToken, 'token')}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-400"
                >
                  {copiedKey === 'token' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {t('settings.mcp.copyToken')}
                </Button>
              </div>
              <div className="rounded-lg bg-neutral-950/80 border border-neutral-800 p-3 font-mono text-xs text-emerald-100 break-all">
                {plainToken}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2 text-neutral-200">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-medium">{t('settings.mcp.commandTitle')}</p>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!mcpCommand}
                onClick={() => copyText(mcpCommand, 'command')}
                className="rounded-full bg-neutral-800 hover:bg-neutral-700"
              >
                {copiedKey === 'command' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {t('settings.mcp.copyCommand')}
              </Button>
            </div>
            <pre className="min-h-[88px] overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/40 border border-neutral-800 p-3 font-mono text-xs text-neutral-300">
              {mcpCommand || t('settings.mcp.commandEmpty')}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-300">{t('settings.mcp.activeTokens')}</p>
              <span className="text-xs text-neutral-500">{tokens.filter((token) => !token.revokedAt).length}</span>
            </div>
            <div className="rounded-xl border border-neutral-800 overflow-hidden">
              {tokens.length === 0 ? (
                <div className="px-4 py-5 text-sm text-neutral-500">{t('settings.mcp.emptyTokens')}</div>
              ) : (
                tokens.map((token) => (
                  <div key={token.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-b border-neutral-800 last:border-b-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-100 truncate">{token.name}</p>
                        <span className={token.revokedAt ? 'text-[11px] text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full' : 'text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full'}>
                          {token.revokedAt ? t('settings.mcp.revoked') : t('settings.mcp.active')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-mono mt-1">{token.tokenPreview}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-neutral-500 whitespace-nowrap">
                        {token.lastUsedAt ? t('settings.mcp.lastUsed', { date: formatDate(token.lastUsedAt) }) : t('settings.mcp.neverUsed')}
                      </p>
                      <Button
                        type="button"
                        size="icon"
                        disabled={Boolean(token.revokedAt)}
                        onClick={() => handleRevokeToken(token.id)}
                        className="h-9 w-9 rounded-full bg-neutral-800 hover:bg-red-500/20 hover:text-red-200"
                        aria-label={t('settings.mcp.revoke')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getMcpApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3111';
  const normalized = baseUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

function normalizeCloudResumes(value: unknown): CloudResumeOption[] {
  const maybeData = value as { data?: unknown };
  const list = Array.isArray(value)
    ? value
    : Array.isArray(maybeData?.data)
      ? maybeData.data
      : Array.isArray((maybeData?.data as { data?: unknown })?.data)
        ? (maybeData.data as { data: unknown[] }).data
        : [];

  return list
    .map((item) => {
      const resume = item as { id?: string; title?: string; name?: string };
      if (!resume.id) return null;
      return {
        id: resume.id,
        title: resume.title || resume.name || resume.id,
      };
    })
    .filter((item): item is CloudResumeOption => Boolean(item));
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getApiErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null;

  const data = error.response?.data as { message?: unknown } | undefined;
  if (typeof data?.message === 'string') {
    return data.message;
  }

  return null;
}

function isAxiosError(error: unknown): error is AxiosError {
  return Boolean(error && typeof error === 'object' && 'isAxiosError' in error);
}

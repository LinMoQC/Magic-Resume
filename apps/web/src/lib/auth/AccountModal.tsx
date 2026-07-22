'use client';

// Cloud-only. Our own dark, READ-ONLY account panel — modelled on the admin
// UserDetailsModal (资料/安全/活动 + side rail) but rebuilt in our tokens and fed
// purely from Clerk's client `useUser()` + the app's own resume store (no backend,
// no embedded Clerk <UserProfile>). Clerk imports stay inside lib/auth.

import React, { useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  Check,
  Copy,
  FileText,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { isCloudMode } from '@/lib/config/app';
import { ModalShell } from '@/components/ui/ModalShell';
import { useAccountUiStore } from '@/store/useAccountUiStore';
import { useResumeStore } from '@/store/useResumeStore';
import { useEntitlement } from '@/lib/billing/useEntitlement';
import type { Entitlement } from '@/lib/billing/types';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'security' | 'activity';

const PROVIDERS: Record<string, { name: string; color: string }> = {
  google: { name: 'Google', color: '#ea4335' },
  github: { name: 'GitHub', color: '#8b949e' },
  gitlab: { name: 'GitLab', color: '#fc6d26' },
  discord: { name: 'Discord', color: '#5865f2' },
  apple: { name: 'Apple', color: '#a1a1aa' },
  microsoft: { name: 'Microsoft', color: '#3b82f6' },
  linkedin: { name: 'LinkedIn', color: '#0a66c2' },
  facebook: { name: 'Facebook', color: '#1877f2' },
};

const providerDisplay = (provider: string) => {
  const key = (provider || '').replace(/^oauth_/, '').toLowerCase();
  return PROVIDERS[key] || { name: provider || 'Unknown', color: '#6b7280' };
};

export function AccountModal() {
  // Constant gate — no hooks here, so `useUser()` (below) only ever runs inside
  // ClerkProvider (cloud mode). Self-hosted renders nothing.
  if (!isCloudMode) return null;
  return <CloudAccountModal />;
}

function CloudAccountModal() {
  const { t, i18n } = useTranslation();
  const { accountOpen, closeAccount, openPricing } = useAccountUiStore();
  const { isLoaded, user } = useUser();
  const resumes = useResumeStore((s) => s.resumes);
  const { data: entitlement } = useEntitlement(accountOpen);
  const [tab, setTab] = useState<Tab>('profile');
  const [copied, setCopied] = useState<string | null>(null);

  const goUpgrade = () => {
    closeAccount();
    openPricing();
  };

  const locale = i18n.language.startsWith('en') ? 'en-US' : 'zh-CN';
  const fmtDate = (d?: Date | number | string | null) =>
    d ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d)) : t('account.profile.never');
  const fmtDateTime = (d?: Date | number | string | null) =>
    d
      ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
      : t('account.profile.never');

  const copy = async (text: string | null | undefined, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  const recentResumes = useMemo(
    () => [...resumes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)).slice(0, 5),
    [resumes],
  );

  // Client-only "activity" — sign-in events live in the backend, so the heatmap
  // is built from resume edit timestamps (each resume's updatedAt + version history).
  const heatmap = useMemo(() => {
    const ts: number[] = [];
    for (const r of resumes) {
      if (typeof r.updatedAt === 'number') ts.push(r.updatedAt);
      const versions = (r as { versions?: { updatedAt?: number }[] }).versions;
      if (Array.isArray(versions)) {
        for (const v of versions) if (typeof v?.updatedAt === 'number') ts.push(v.updatedAt);
      }
    }
    return computeHeatmap(ts);
  }, [resumes]);

  const view = useMemo(() => {
    if (!user) return null;
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.username ||
      user.primaryEmailAddress?.emailAddress ||
      'User';
    const emails = user.emailAddresses.map((e) => ({
      id: e.id,
      email: e.emailAddress,
      verified: e.verification?.status === 'verified',
      primary: e.id === user.primaryEmailAddressId,
    }));
    const externals = user.externalAccounts.map((a) => ({
      id: a.id,
      provider: a.provider,
      label: a.emailAddress || a.username || '',
      verified: a.verification?.status === 'verified',
    }));
    const phones = user.phoneNumbers.map((p) => ({
      id: p.id,
      number: p.phoneNumber,
      primary: p.id === user.primaryPhoneNumberId,
    }));
    const days = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000) : null;
    return { displayName, emails, externals, phones, days };
  }, [user]);

  const lastActive = useMemo(() => {
    const last = user?.lastSignInAt;
    if (!last) return t('account.profile.neverActive');
    const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
    if (days <= 0) return t('account.profile.activeToday');
    if (days === 1) return t('account.profile.activeYesterday');
    return t('account.profile.activeDaysAgo', { count: days });
  }, [user, t]);

  const initial = (view?.displayName?.[0] || 'U').toUpperCase();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: t('account.profile.tabs.profile') },
    { key: 'security', label: t('account.profile.tabs.security') },
    { key: 'activity', label: t('account.profile.tabs.activity') },
  ];

  return (
    <ModalShell
      open={accountOpen}
      onOpenChange={(open) => !open && closeAccount()}
      title={t('account.modal.title')}
      className="h-[min(700px,88vh)] w-[min(920px,92vw)]"
    >
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide px-6 py-5">
        {!isLoaded ? (
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-32 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        ) : !user || !view ? (
          <p className="py-16 text-center text-sm text-neutral-500">{t('account.profile.loadFailed')}</p>
        ) : (
          <>
            {/* header — items-center keeps the short avatar block vertically
                balanced against the taller usage card on the right */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-[18px] font-medium text-neutral-300 ring-1 ring-white/10">
                {user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.imageUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[20px] font-medium text-neutral-100">{view.displayName}</h2>
                  {user.twoFactorEnabled && <Badge tone="emerald">{t('account.profile.twoFactor')}</Badge>}
                </div>
                <p className="mt-0.5 text-[13px] text-neutral-500">{lastActive}</p>
              </div>

              {/* subscription-usage cluster — the single place subscription info lives;
                  clicking it opens the pricing modal */}
              {entitlement && (
                <UsageCluster entitlement={entitlement} onClick={goUpgrade} fmtDateTime={fmtDateTime} t={t} />
              )}
            </div>

            {/* tabs */}
            <div className="mt-6 flex items-center gap-5 border-b border-white/[0.06]">
              {tabs.map((tb) => (
                <button
                  key={tb.key}
                  type="button"
                  onClick={() => setTab(tb.key)}
                  className={cn(
                    'relative pb-3 text-[13px] transition-colors',
                    tab === tb.key ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-200',
                  )}
                >
                  {tb.label}
                  {tab === tb.key && <span className="absolute -bottom-px left-0 right-0 h-px bg-sky-400" />}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
              {/* main column */}
              <div className="min-w-0 space-y-4">
                {tab === 'profile' && (
                  <>
                    <Section title={t('account.profile.personalInfo')}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label={t('account.profile.firstName')} value={user.firstName} />
                        <Field label={t('account.profile.lastName')} value={user.lastName} />
                        <Field label={t('account.profile.username')} value={user.username ? `@${user.username}` : null} />
                      </div>
                    </Section>

                    <Section title={t('account.profile.emails')}>
                      {view.emails.map((e, i) => (
                        <div
                          key={e.id}
                          className={cn('flex flex-wrap items-center gap-2 py-2', i > 0 && 'border-t border-white/[0.04]')}
                        >
                          <BadgeCheck size={16} className={e.verified ? 'text-emerald-400' : 'text-neutral-600'} />
                          <span className="truncate text-[13px] text-neutral-100">{e.email}</span>
                          {e.primary && <Badge tone="emerald">{t('account.profile.primary')}</Badge>}
                          {!e.verified && <Badge tone="amber">{t('account.profile.unverified')}</Badge>}
                        </div>
                      ))}
                    </Section>

                    {view.externals.length > 0 && (
                      <Section title={t('account.profile.social')}>
                        {view.externals.map((a, i) => {
                          const p = providerDisplay(a.provider);
                          return (
                            <div
                              key={a.id}
                              className={cn('flex flex-wrap items-center gap-2 py-2', i > 0 && 'border-t border-white/[0.04]')}
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="text-[13px] font-medium text-neutral-100">{p.name}</span>
                              {a.label && <span className="truncate text-[12px] text-neutral-500">{a.label}</span>}
                              {a.verified && <Badge tone="emerald">{t('account.profile.verified')}</Badge>}
                            </div>
                          );
                        })}
                      </Section>
                    )}

                    {view.phones.length > 0 && (
                      <Section title={t('account.profile.phones')}>
                        {view.phones.map((p, i) => (
                          <div key={p.id} className={cn('flex items-center gap-2 py-2', i > 0 && 'border-t border-white/[0.04]')}>
                            <span className="text-[13px] text-neutral-100">{p.number}</span>
                            {p.primary && <Badge tone="emerald">{t('account.profile.primary')}</Badge>}
                          </div>
                        ))}
                      </Section>
                    )}
                  </>
                )}

                {tab === 'security' && (
                  <Section title={t('account.profile.security')}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <SecurityItem icon={<KeyRound size={16} />} label={t('account.profile.password')} on={!!user.passwordEnabled} t={t} />
                      <SecurityItem icon={<ShieldCheck size={16} />} label={t('account.profile.twoFactor')} on={!!user.twoFactorEnabled} t={t} />
                      <SecurityItem icon={<Lock size={16} />} label={t('account.profile.totp')} on={!!user.totpEnabled} t={t} />
                      <SecurityItem icon={<ShieldAlert size={16} />} label={t('account.profile.backupCodes')} on={!!user.backupCodeEnabled} t={t} />
                    </div>
                  </Section>
                )}

                {tab === 'activity' && (
                  <>
                    <ActivityHeatmap data={heatmap} />
                    <div className="grid grid-cols-3 gap-3">
                      <Stat label={t('account.profile.stats.resumes')} value={resumes.length} />
                      <Stat label={t('account.profile.stats.social')} value={view.externals.length} />
                      <Stat label={t('account.profile.stats.days')} value={view.days ?? '—'} />
                    </div>
                    <Section title={t('account.profile.recentResumes')} icon={<FileText size={16} className="text-neutral-500" />}>
                      {recentResumes.length > 0 ? (
                        recentResumes.map((r, i) => (
                          <div
                            key={r.id}
                            className={cn('flex items-center justify-between gap-3 py-2', i > 0 && 'border-t border-white/[0.04]')}
                          >
                            <span className="truncate text-[13px] text-neutral-100">{r.name || t('account.profile.untitled')}</span>
                            <span className="shrink-0 text-[12px] tabular-nums text-neutral-500">{fmtDate(r.updatedAt)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="py-1 text-[12px] text-neutral-500">{t('account.profile.noResumes')}</p>
                      )}
                    </Section>
                  </>
                )}

              </div>

              {/* side rail */}
              <aside className="space-y-4 text-[13px]">
                <SideCopy label={t('account.profile.side.userId')} value={user.id} copyKey="id" copied={copied} onCopy={copy} mono />
                <SideCopy label={t('account.profile.side.primaryEmail')} value={user.primaryEmailAddress?.emailAddress} copyKey="email" copied={copied} onCopy={copy} />
                <SideInfo label={t('account.profile.side.joinedAt')} value={fmtDate(user.createdAt)} />
                <SideInfo label={t('account.profile.side.updatedAt')} value={fmtDate(user.updatedAt)} />
                <SideInfo label={t('account.profile.side.lastSignIn')} value={fmtDateTime(user.lastSignInAt)} />
              </aside>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

/* ---- small building blocks ---- */

type Tone = 'emerald' | 'amber' | 'neutral';
function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : tone === 'amber'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-white/[0.06] text-neutral-300 border-white/10';
  return <span className={cn('inline-flex h-5 items-center rounded border px-1.5 text-[11px]', cls)}>{children}</span>;
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-medium text-neutral-100">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] text-neutral-500">{label}</label>
      <div className="flex h-8 items-center rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 text-[13px] text-neutral-100">
        {value || '—'}
      </div>
    </div>
  );
}

function SecurityItem({
  icon,
  label,
  on,
  t,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  t: (k: string) => string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-[13px] text-neutral-100">
        <span className="text-neutral-500">{icon}</span>
        {label}
      </div>
      <Badge tone={on ? 'emerald' : 'neutral'}>
        {on ? t('account.profile.enabled') : t('account.profile.disabled')}
      </Badge>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[12px] text-neutral-500">{label}</div>
      <div className="mt-1 text-[22px] font-medium tabular-nums text-neutral-100">{value}</div>
    </div>
  );
}

function SideInfo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[12px] text-neutral-500">{label}</div>
      <div className="tabular-nums text-neutral-100">{value}</div>
    </div>
  );
}

function SideCopy({
  label,
  value,
  copyKey,
  copied,
  onCopy,
  mono,
}: {
  label: string;
  value?: string | null;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string | null | undefined, key: string) => void;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-[12px] text-neutral-500">{label}</div>
      <button
        type="button"
        onClick={() => onCopy(value, copyKey)}
        className="group inline-flex max-w-full items-center gap-1.5 text-left text-neutral-100 transition-colors hover:text-sky-300"
      >
        <span className={cn('truncate', mono && 'font-mono text-[12px]')} style={{ maxWidth: 180 }}>
          {value || '—'}
        </span>
        {copied === copyKey ? (
          <Check size={14} className="shrink-0 text-emerald-400" />
        ) : (
          <Copy size={14} className="shrink-0 text-neutral-500 transition-colors group-hover:text-sky-300" />
        )}
      </button>
    </div>
  );
}

/* ---- subscription usage ---- */

type TFn = (k: string, o?: Record<string, unknown>) => string;

function remainingLabel(used: number, limit: number, t: TFn) {
  if (!limit || limit <= 0) return t('account.subscription.unlimited');
  return t('account.subscription.remaining', { count: Math.max(0, limit - used) });
}

function MiniBar({ used, limit }: { used: number; limit: number }) {
  const unlimited = !limit || limit <= 0;
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400',
          unlimited && 'opacity-60',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function UsageCluster({
  entitlement,
  onClick,
  fmtDateTime,
  t,
}: {
  entitlement: Entitlement;
  onClick: () => void;
  fmtDateTime: (d?: Date | number | string | null) => string;
  t: TFn;
}) {
  const { usage, currentPlan } = entitlement;
  const rows = [
    { label: t('account.subscription.today'), used: usage.dailyUsed, limit: usage.dailyLimit, resetAt: usage.dailyResetAt },
    { label: t('account.subscription.week'), used: usage.weeklyUsed, limit: usage.weeklyLimit, resetAt: usage.weeklyResetAt },
  ];
  // Horizontal, header-height layout — the card must stay roughly as tall as the
  // avatar block or the whole header inflates and the left side looks stranded.
  return (
    <button
      type="button"
      onClick={onClick}
      title={t('account.menu.upgrade')}
      className="group hidden shrink-0 items-center gap-3.5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-sky-500/[0.08] via-white/[0.02] to-white/[0.02] p-3 text-left transition-colors duration-150 hover:border-sky-400/40 sm:flex"
    >
      <div className="flex flex-col items-start gap-1">
        <span className="whitespace-nowrap text-[11px] text-neutral-500">{t('account.subscription.currentPlan')}</span>
        <span className="inline-flex h-5 items-center rounded-md border border-sky-400/25 bg-sky-400/10 px-1.5 text-[11px] font-semibold text-sky-300">
          {currentPlan?.name ?? '—'}
        </span>
      </div>
      <div className="w-px self-stretch bg-white/[0.08]" />
      <div className="w-48 space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-2 text-[11px]"
            title={row.resetAt ? t('account.subscription.resetAt', { time: fmtDateTime(row.resetAt) }) : undefined}
          >
            <span className="shrink-0 text-neutral-400">{row.label}</span>
            <MiniBar used={row.used} limit={row.limit} />
            <span className="shrink-0 tabular-nums text-neutral-300">{remainingLabel(row.used, row.limit, t)}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

/* ---- activity heatmap (client-only, from resume edit timestamps) ---- */

type HeatCell = { date: string; count: number; level: number };
type Heatmap = { columns: HeatCell[][]; monthBands: { span: number; month: number }[]; total: number; activeDays: number };

const HEAT_LEVELS = ['bg-white/[0.05]', 'bg-sky-500/25', 'bg-sky-500/45', 'bg-sky-500/70', 'bg-sky-400'];
const DAY_MS = 86400000;

function computeHeatmap(timestamps: number[]): Heatmap {
  const counts: Record<string, number> = {};
  for (const t of timestamps) {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  }
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay())); // align forward to Saturday
  const start = new Date(end.getTime() - 371 * DAY_MS);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // align back to Sunday

  let total = 0;
  let activeDays = 0;
  let max = 0;
  const days: { date: string; count: number }[] = [];
  for (let ts = start.getTime(); ts <= end.getTime(); ts += DAY_MS) {
    const key = new Date(ts).toISOString().slice(0, 10);
    const count = counts[key] || 0;
    days.push({ date: key, count });
    if (count > 0) {
      total += count;
      activeDays++;
      if (count > max) max = count;
    }
  }
  const levelOf = (n: number) => {
    if (n <= 0) return 0;
    if (max <= 1) return 4;
    const r = n / max;
    return r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : 4;
  };
  const columns: HeatCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7).map((d) => ({ ...d, level: levelOf(d.count) })));
  }
  const monthBands: { span: number; month: number }[] = [];
  let runMonth = -1;
  let runStart = 0;
  columns.forEach((col, c) => {
    const m = new Date(col[0].date + 'T00:00:00Z').getUTCMonth();
    if (m !== runMonth) {
      if (runMonth >= 0) monthBands.push({ span: c - runStart, month: runMonth });
      runMonth = m;
      runStart = c;
    }
  });
  if (runMonth >= 0) monthBands.push({ span: columns.length - runStart, month: runMonth });
  return { columns, monthBands, total, activeDays };
}

function ActivityHeatmap({ data }: { data: Heatmap }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en-US' : 'zh-CN';
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' });
  const dateFmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  // 2023-01-01 is a Sunday → derive locale weekday initials Sun..Sat
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayFmt.format(new Date(Date.UTC(2023, 0, 1 + i))));
  const CELL = 12;

  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-medium text-neutral-100">{t('account.profile.heatmap.title')}</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            {t('account.profile.heatmap.summary', { total: data.total, days: data.activeDays })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span>{t('account.profile.heatmap.less')}</span>
          {HEAT_LEVELS.map((clsName, i) => (
            <span key={i} className={cn('h-2.5 w-2.5 rounded-[2px]', clsName)} />
          ))}
          <span>{t('account.profile.heatmap.more')}</span>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="inline-flex flex-col">
          <div className="mb-1 flex pl-7 text-[10px] text-neutral-500">
            {data.monthBands.map((b, i) => (
              <span key={i} style={{ width: b.span * CELL, minWidth: b.span * CELL }}>
                {monthFmt.format(new Date(Date.UTC(2020, b.month, 1)))}
              </span>
            ))}
          </div>
          <div className="flex">
            <div className="mr-1.5 flex flex-col gap-[2px] pt-[1px] text-[10px] text-neutral-500">
              {weekdays.map((d, i) => (
                <span key={i} className={cn('h-[10px] leading-[10px]', i % 2 === 0 && 'opacity-0')}>
                  {d}
                </span>
              ))}
            </div>
            <div className="flex gap-[2px]">
              {data.columns.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[2px]">
                  {col.map((cell) => (
                    <span
                      key={cell.date}
                      title={`${dateFmt.format(new Date(cell.date + 'T00:00:00Z'))} · ${cell.count} ${t('account.profile.heatmap.edits')}`}
                      className={cn('h-[10px] w-[10px] rounded-[2px] transition-transform hover:scale-150', HEAT_LEVELS[cell.level])}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

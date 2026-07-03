'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useClerk } from '@clerk/nextjs';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, Bell, FlaskConical } from 'lucide-react';
import { getCountdownTimeLeft, type CountdownTimeLeft } from '@/lib/utils/dateTime';

interface ComingSoonProps {
  launchAt: string | null;
  waitlistUrl: string | null;
  contactEmail: string | null;
}

const BRAND_FONT = { fontFamily: 'var(--font-brand)' } as const;

/**
 * 背景舞台:一份正在被 AI"写出来"的简历。骨架条自左侧逐行成型(scaleX),
 * 少数行持续微光流动 = AI 的光标在走。纯装饰,aria-hidden。
 */
const STAGE_SECTIONS: Array<{ head: string; lines: Array<{ w: string; active?: boolean }> }> = [
  { head: '32%', lines: [{ w: '94%' }, { w: '86%', active: true }, { w: '70%' }] },
  { head: '26%', lines: [{ w: '90%' }, { w: '78%' }, { w: '64%', active: true }] },
  { head: '30%', lines: [{ w: '88%' }, { w: '72%' }] },
];

function StageResume({ className }: { className?: string }) {
  // 递增的入场延迟:让骨架条一条接一条被"写"出来
  let step = 0;
  const delay = () => ({ animationDelay: `${(0.3 + step++ * 0.06).toFixed(2)}s` });

  return (
    <div className={`cs-resume ${className ?? ''}`}>
      <div className="cs-panel">
        <span className="cs-scan" />

        {/* header:头像 + 姓名 + (正在被写的) 职位 */}
        <div className="flex items-center gap-3">
          <span
            className="cs-avatar shrink-0"
            style={{ width: 44, height: 44, borderRadius: 9999, background: 'rgba(var(--cs-sky), 0.16)', ...delay() }}
          />
          <div className="flex-1 space-y-2">
            <span className="cs-bar cs-bar--head block" style={{ width: '46%', ...delay() }} />
            <span className="cs-bar cs-bar--active block" style={{ width: '30%', ...delay() }} />
          </div>
        </div>

        {/* skill chips */}
        <div className="mt-5 flex gap-2">
          {[64, 48, 72].map((w, i) => (
            <span key={i} className="cs-bar" style={{ width: w, height: 18, borderRadius: 6, ...delay() }} />
          ))}
        </div>

        {/* sections */}
        <div className="mt-6 space-y-5">
          {STAGE_SECTIONS.map((s, si) => (
            <div key={si} className="space-y-2.5">
              <span className="cs-bar cs-bar--head block" style={{ width: s.head, ...delay() }} />
              {s.lines.map((ln, li) => (
                <span
                  key={li}
                  className={`cs-bar block ${ln.active ? 'cs-bar--active' : ''}`}
                  style={{ width: ln.w, ...delay() }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CountUnit({
  value,
  label,
  reduce,
}: {
  value: number | null;
  label: string;
  reduce: boolean;
}) {
  const text = value === null ? '--' : String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-[2.2rem] min-w-[1.6em] items-center justify-center overflow-hidden sm:h-[3.4rem]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={reduce ? false : { y: '55%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: '-55%', opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="block text-[2rem] font-semibold leading-none tabular-nums text-white sm:text-[3.25rem]"
            style={BRAND_FONT}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</span>
    </div>
  );
}

export default function ComingSoon({
  launchAt,
  waitlistUrl,
  contactEmail,
}: ComingSoonProps) {
  const { t } = useTranslation();
  const { signOut } = useClerk();
  const reduce = useReducedMotion() ?? false;

  const target = launchAt ? new Date(launchAt).getTime() : null;
  const hasTarget = target !== null && !Number.isNaN(target);

  // Countdown is computed only after mount to avoid a hydration mismatch
  // (server time vs client time).
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<CountdownTimeLeft | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!hasTarget) return;
    const tick = () => setTimeLeft(getCountdownTimeLeft(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, hasTarget]);

  const launched =
    hasTarget && mounted && timeLeft !== null && target <= Date.now();

  const reserveHref = waitlistUrl || (contactEmail ? `mailto:${contactEmail}` : null);

  const units: Array<{ key: keyof CountdownTimeLeft; label: string }> = [
    { key: 'days', label: t('comingSoon.days') },
    { key: 'hours', label: t('comingSoon.hours') },
    { key: 'minutes', label: t('comingSoon.minutes') },
    { key: 'seconds', label: t('comingSoon.seconds') },
  ];

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <main className="cs-root relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      {/* ambient stage */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="cs-aura cs-aura--a" />
        <span className="cs-aura cs-aura--b" />
        <div className="cs-grid" />
        <div className="cs-stage">
          <StageResume />
          <StageResume className="cs-resume--ghost" />
        </div>
        <div className="cs-vignette" />
      </div>

      {/* Already signed in (page requires auth) — offer sign out / switch account */}
      <button
        type="button"
        onClick={() => signOut({ redirectUrl: '/sign-in' })}
        className="absolute right-5 top-5 z-20 rounded-md px-2 py-1 text-xs font-medium text-white/40 transition-colors hover:text-sky-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/60"
      >
        {t('comingSoon.signOut')}
      </button>

      <motion.div
        variants={container}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center"
      >
        <motion.span
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-400 backdrop-blur-sm"
        >
          <FlaskConical className="h-3 w-3" strokeWidth={2.2} />
          {'Magic Resume'}
          <span className="cs-dot ml-0.5 h-1.5 w-1.5 rounded-full bg-sky-400" />
        </motion.span>

        <motion.h1
          variants={item}
          className="text-balance text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-[3rem]"
        >
          {launched ? t('comingSoon.launched') : t('comingSoon.title')}
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-white/55 sm:text-base"
        >
          {t('comingSoon.subtitle')}
        </motion.p>

        {/* Countdown — the protagonist while we're pre-launch */}
        {!launched && hasTarget && (
          <motion.div
            variants={item}
            className="mt-9 w-full rounded-2xl border border-white/[0.06] bg-white/[0.015] px-5 py-5 sm:px-8"
          >
            <div className="mb-4 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-sky-400/80">
              <span className="cs-dot h-1 w-1 rounded-full bg-sky-400" />
              {t('comingSoon.countdownLabel')}
            </div>
            <div className="flex items-start justify-center gap-1.5 sm:gap-4">
              {units.map((u, idx) => (
                <Fragment key={u.key}>
                  {idx > 0 && (
                    <span
                      className="cs-colon flex h-[2.2rem] items-center text-2xl font-light text-white/25 sm:h-[3.4rem] sm:text-4xl"
                      style={BRAND_FONT}
                    >
                      :
                    </span>
                  )}
                  <CountUnit
                    value={mounted && timeLeft ? timeLeft[u.key] : null}
                    label={u.label}
                    reduce={reduce}
                  />
                </Fragment>
              ))}
            </div>
          </motion.div>
        )}

        {/* No launch date set — concept still holds without a countdown */}
        {!launched && !hasTarget && (
          <motion.p
            variants={item}
            className="mt-8 text-sm font-medium tracking-wide text-sky-400/90"
          >
            {t('comingSoon.noDate')}
          </motion.p>
        )}

        {/* Primary action */}
        <motion.div variants={item} className="mt-9 flex flex-col items-center gap-3">
          {launched ? (
            <Link
              href="/"
              className="cs-cta inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-[#0A0A0A] shadow-[0_14px_44px_-14px_rgba(56,189,248,0.7)] hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            >
              {t('comingSoon.enterCta')}
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </Link>
          ) : reserveHref ? (
            <>
              <a
                href={reserveHref}
                target={waitlistUrl ? '_blank' : undefined}
                rel={waitlistUrl ? 'noreferrer' : undefined}
                className="cs-cta inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-[#0A0A0A] shadow-[0_14px_44px_-14px_rgba(56,189,248,0.7)] hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
              >
                <Bell className="h-4 w-4" strokeWidth={2.2} />
                {t('comingSoon.reserveCta')}
              </a>
              <p className="max-w-xs text-xs leading-relaxed text-white/40">
                {t('comingSoon.reserveNote')}
              </p>
            </>
          ) : null}
        </motion.div>
      </motion.div>
    </main>
  );
}

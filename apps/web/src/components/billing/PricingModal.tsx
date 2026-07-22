'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Loader2, Sparkles, X, Zap, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isCloudMode } from '@/lib/config/app';
import { useAccountUiStore } from '@/store/useAccountUiStore';
import { useEntitlement } from '@/lib/billing/useEntitlement';
import { createSubscription, fetchPlans } from '@/lib/billing/client';
import type { PlanSummary } from '@/lib/billing/types';
import { cn } from '@/lib/utils';

export function PricingModal() {
  if (!isCloudMode) return null;
  return <CloudPricingModal />;
}

type Tx = (k: string, o?: Record<string, unknown>) => string;

/** Price broken into parts so the currency symbol can sit small above the amount (GPT style). */
function priceParts(plan: PlanSummary, t: Tx) {
  if (plan.priceCents === 0) return { free: true as const, symbol: '', number: t('pricing.free'), suffix: '' };
  const symbol = plan.currency === 'CNY' ? '¥' : '$';
  const number = (plan.priceCents / 100).toLocaleString();
  const suffix = plan.interval === 'month' ? `${plan.currency} ${t('pricing.perMonth')}` : plan.currency;
  return { free: false as const, symbol, number, suffix };
}

/** Feature rows, each with its own icon — replaces the uniform check bullets. */
function featureRows(plan: PlanSummary, t: Tx): { icon: LucideIcon; label: string }[] {
  return [
    {
      icon: Sparkles,
      label:
        plan.modelAllowlist.length > 0
          ? t('pricing.features.models', { count: plan.modelAllowlist.length })
          : t('pricing.features.coreModel'),
    },
    {
      icon: Zap,
      label: plan.dailyLimit > 0 ? t('pricing.features.daily', { count: plan.dailyLimit }) : t('pricing.features.dailyUnlimited'),
    },
    {
      icon: CalendarDays,
      label: plan.weeklyLimit > 0 ? t('pricing.features.weekly', { count: plan.weeklyLimit }) : t('pricing.features.weeklyUnlimited'),
    },
  ];
}

function CloudPricingModal() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const { pricingOpen, closePricing } = useAccountUiStore();
  const { data: entitlement } = useEntitlement(pricingOpen);
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!pricingOpen) return;
    let alive = true;
    setError(null);
    setPlans(null);
    fetchPlans()
      .then((p) => alive && setPlans(p))
      .catch((e) => alive && setError(e instanceof Error ? e.message : '套餐加载失败'));
    return () => {
      alive = false;
    };
  }, [pricingOpen]);

  const sorted = useMemo(
    () => (plans ? [...plans].sort((a, b) => a.priceCents - b.priceCents) : []),
    [plans],
  );
  const currentPlanId = entitlement?.currentPlan?.id ?? null;
  const currentPriceCents = entitlement?.currentPlan?.priceCents ?? 0;
  // "热门": cheapest paid subscription tier.
  const recommendedId = useMemo(
    () => sorted.find((p) => p.kind === 'subscription' && p.priceCents > 0)?.id ?? null,
    [sorted],
  );

  const onUpgrade = async (plan: PlanSummary) => {
    setPendingId(plan.id);
    try {
      const url = await createSubscription(plan.id);
      if (url) {
        window.location.href = url;
        return;
      }
      toast.success(t('pricing.created'));
      closePricing();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pricing.error'));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <DialogPrimitive.Root open={pricingOpen} onOpenChange={(o) => !o && closePricing()}>
      <AnimatePresence>
        {pricingOpen && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-desk/95 backdrop-blur-md"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-50 flex flex-col overflow-y-auto scrollbar-hide"
              >
                {/* sky top-seam — instrument signature carried over from ModalShell */}
                <div className="pointer-events-none fixed inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

                <DialogPrimitive.Close className="fixed right-6 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50">
                  <X size={18} />
                </DialogPrimitive.Close>

                <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-20">
                  <DialogPrimitive.Title className="mb-12 text-center text-3xl font-semibold tracking-tight text-neutral-50">
                    {t('pricing.title')}
                  </DialogPrimitive.Title>

                  {error ? (
                    <p className="py-16 text-center text-sm text-neutral-500">{error}</p>
                  ) : !plans ? (
                    <div className="flex w-full flex-col items-stretch gap-6 md:flex-row md:justify-center">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[420px] flex-1 animate-pulse rounded-3xl bg-white/[0.03] md:h-[min(600px,72vh)] md:max-w-[400px]" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex w-full flex-col items-stretch gap-6 md:flex-row md:justify-center">
                      {sorted.map((plan) => {
                        const isCurrent = plan.id === currentPlanId;
                        const isHot = plan.id === recommendedId;
                        const isPaid = plan.priceCents > 0 && plan.kind === 'subscription';
                        // Only a strictly higher-priced paid tier is a real upgrade — lower/equal
                        // paid tiers are downgrades and must not be actionable.
                        const isUpgrade = isPaid && !isCurrent && plan.priceCents > currentPriceCents;
                        const price = priceParts(plan, t);
                        const pending = pendingId === plan.id;
                        return (
                          <div
                            key={plan.id}
                            className={cn(
                              'relative flex flex-1 flex-col rounded-3xl border p-8 md:min-h-[min(600px,72vh)] md:max-w-[400px]',
                              isHot
                                ? 'border-sky-400/40 bg-gradient-to-b from-sky-500/[0.12] to-sky-500/[0.02] shadow-[0_0_60px_-20px_rgba(56,189,248,0.5)]'
                                : 'border-white/[0.07] bg-white/[0.02]',
                            )}
                          >
                            {isHot && (
                              <span className="absolute right-5 top-6 rounded-full bg-sky-400/15 px-2.5 py-0.5 text-[11px] font-medium text-sky-200">
                                {t('pricing.popular')}
                              </span>
                            )}

                            <h3 className="text-[22px] font-semibold text-neutral-50">{plan.name}</h3>

                            <div className="mt-4 flex items-start gap-1">
                              {!price.free && <span className="mt-1.5 text-lg font-medium text-neutral-400">{price.symbol}</span>}
                              <span className="text-[44px] font-bold leading-none tracking-tight text-neutral-50">
                                {price.number}
                              </span>
                              {price.suffix && <span className="mt-2 ml-1 text-[12px] text-neutral-500">{price.suffix}</span>}
                            </div>

                            <p className="mt-2 text-[13px] text-neutral-400">
                              {isPaid ? t('pricing.tagline.paid') : t('pricing.tagline.free')}
                            </p>

                            <button
                              type="button"
                              disabled={!isUpgrade || pending}
                              onClick={() => onUpgrade(plan)}
                              className={cn(
                                'mt-6 flex h-11 items-center justify-center gap-2 rounded-full text-[14px] font-medium transition-colors',
                                !isUpgrade
                                  ? 'cursor-default bg-white/[0.05] text-neutral-500'
                                  : isHot
                                    ? 'bg-sky-400 text-[#06232f] hover:bg-sky-300'
                                    : 'bg-neutral-100 text-neutral-900 hover:bg-white',
                              )}
                            >
                              {pending && <Loader2 size={15} className="animate-spin" />}
                              {isCurrent
                                ? t('pricing.current')
                                : isUpgrade
                                  ? t('pricing.upgradeTo', { name: plan.name })
                                  : isPaid
                                    ? t('pricing.included')
                                    : t('pricing.free')}
                            </button>

                            <ul className="mt-7 space-y-3.5">
                              {featureRows(plan, t).map(({ icon: Icon, label }, i) => (
                                <li key={i} className="flex items-center gap-3 text-[13.5px] text-neutral-300">
                                  <Icon size={17} className={cn('shrink-0', isHot ? 'text-sky-300' : 'text-neutral-500')} />
                                  <span>{label}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

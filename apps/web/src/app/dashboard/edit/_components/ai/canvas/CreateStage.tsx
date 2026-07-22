'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { Resume } from '@/types/frontend/resume';
import ResumePreview from '../../preview/ResumePreview';
import { PolarisGlyph } from '../PolarisMark';

/** 每个区块落定的间隔——快到不磨人，慢到看得清「它在一段段写」 */
const REVEAL_STEP_MS = 300;

/** 与全局心跳同周期（--breath-duration = 2.4s），用负 delay 钉相位 */
const BREATH_PERIOD_MS = 2400;

/**
 * 同心跳的骨架条。相位钉到挂钟时间：任何瞬间挂载的实例都处于同一明暗相位，
 * 替换、增删在肉眼里"没有发生过"（做法承自 PaperSkeletonBars）。
 */
function BreathBars({ withHeader = false }: { withHeader?: boolean }) {
  const [animationDelay] = useState(() => `-${Date.now() % BREATH_PERIOD_MS}ms`);

  return (
    <div className="ai-breath--soft space-y-6" style={{ animationDelay }}>
      {withHeader && (
        <div className="space-y-3">
          <div className="h-7 w-52 rounded bg-neutral-200" />
          <div className="h-3.5 w-72 rounded bg-neutral-100" />
        </div>
      )}
      {(withHeader ? [0, 1, 2] : [0]).map((section) => (
        <div key={section} className={cn('space-y-2.5', withHeader && 'pt-6')}>
          <div className="h-4 w-36 rounded bg-neutral-200" />
          <div className="h-3 w-full rounded bg-neutral-100" />
          <div className="h-3 w-11/12 rounded bg-neutral-100" />
          <div className="h-3 w-4/5 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

type CreateStageProps = {
  open: boolean;
  /** create 流仍在流式生成（草稿未落地）→ 骨架期 */
  generating: boolean;
  /** 落地的完整草稿（resume_update）→ 逐段成形重放 */
  draft: Resume | null;
  templateId: string;
};

/**
 * 引导创建的右侧舞台——「逐段成形」（docs/specs/ai-working-motion §5.2）。
 * 等待期：同心跳的纸面骨架。草稿落地：按 sectionOrder 逐段重放落定，头顶一行
 * 叙述报出正在成形的区块名。后端流式 patch 就绪后，把重放换成真流即可。
 */
export default function CreateStage({ open, generating, draft, templateId }: CreateStageProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(0);
  const replayedRef = useRef<Resume | null>(null);

  // 草稿落地 → 逐段重放；同一份草稿只重放一次（re-render 不重启）。
  useEffect(() => {
    if (!draft) {
      replayedRef.current = null;
      setRevealed(0);
      return;
    }
    if (replayedRef.current === draft) return;
    replayedRef.current = draft;
    const total = draft.sectionOrder.length;
    setRevealed(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setRevealed(step);
      if (step >= total) window.clearInterval(timer);
    }, REVEAL_STEP_MS);
    return () => window.clearInterval(timer);
  }, [draft]);

  const total = draft?.sectionOrder.length ?? 0;
  const materializing = !!draft && revealed < total;
  const done = !!draft && revealed >= total && !generating;

  const narration = !draft
    ? t('editPage.ai.narrate.drafting')
    : materializing
      ? t('editPage.ai.narrate.writingSection', { label: draft.sectionOrder[revealed]?.label ?? '' })
      : t('editPage.ai.narrate.draftDone');

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden transition-[width] duration-300 ease-out flex flex-col',
        open ? 'w-[44%] bg-neutral-900/25' : 'w-0'
      )}
    >
      {open && (
        <>
          {/* 叙述行：呼吸的北极星 + 会换词的状态。完成后收成一枚安静的对勾。 */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-xs shrink-0">
            {done ? (
              <Check size={13} className="shrink-0 text-emerald-400" />
            ) : (
              <span className="ai-breath inline-flex shrink-0 text-sky-400/80" aria-hidden="true">
                <PolarisGlyph size={13} />
              </span>
            )}
            <span className="relative h-4 overflow-hidden" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={narration}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('block', done ? 'text-neutral-400' : 'ai-narrate font-medium')}
                >
                  {narration}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5">
            <div className="bg-white/95 rounded-lg p-2 flex justify-center overflow-hidden">
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', minWidth: '600px' }}>
                {draft ? (
                  <>
                    <ResumePreview
                      info={draft.info}
                      sections={draft.sections}
                      sectionOrder={draft.sectionOrder.slice(0, revealed).map((s) => s.key)}
                      templateId={templateId}
                    />
                    {/* 下一段的"正在书写"占位，随每次落定顺移 */}
                    {materializing && (
                      <div className="w-[794px] bg-white px-14 pb-14">
                        <BreathBars />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-[794px] min-h-[1123px] bg-white p-14">
                    <BreathBars withHeader />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AnimatedCheckIcon } from '@/components/icons/AnimatedCheckIcon';

export type PdfPhase = 'extracting' | 'analyzing' | null;

export type PdfImportSection = {
  key: string;
  labelKey: string;
  defaultLabel: string;
};

const SECTION_STAGGER_MS = 45;

export const PDF_SCAN_TIMING = {
  countUpDurationMs: 300,
  checkDrawDurationSec: 0.24,
  completionSweepDurationSec: 0.6,
  activeBandLayoutDurationSec: 0.32,
  scanlinePulseDurationSec: 1.6,
  sectionStaggerMs: SECTION_STAGGER_MS,
  sectionStaggerSec: SECTION_STAGGER_MS / 1000,
  completionHoldMs: 600,
} as const;

/**
 * Resume sections lit up as the parser streams them, in the order their anchors
 * appear in the model's JSON (kept in sync with agent-service
 * `document/lib/pdf-field-progress.ts`). The `key` matches the backend field key.
 */
export const PDF_IMPORT_SECTIONS: PdfImportSection[] = [
  { key: 'info', labelKey: 'importDialog.pdf.sections.info', defaultLabel: '个人信息' },
  { key: 'experience', labelKey: 'importDialog.pdf.sections.experience', defaultLabel: '工作经历' },
  { key: 'education', labelKey: 'importDialog.pdf.sections.education', defaultLabel: '教育经历' },
  { key: 'projects', labelKey: 'importDialog.pdf.sections.projects', defaultLabel: '项目经历' },
  { key: 'skills', labelKey: 'importDialog.pdf.sections.skills', defaultLabel: '技能' },
  { key: 'languages', labelKey: 'importDialog.pdf.sections.languages', defaultLabel: '语言能力' },
  { key: 'certificates', labelKey: 'importDialog.pdf.sections.certificates', defaultLabel: '证书' },
];

export const PDF_IMPORT_SECTION_KEYS = PDF_IMPORT_SECTIONS.map((section) => section.key);

// ease-out-expo — natural deceleration, no bounce (per design language).
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function getCompletePdfSectionSet() {
  return new Set(PDF_IMPORT_SECTION_KEYS);
}

/**
 * Smoothly counts the displayed number toward `value` (ease-out-cubic).
 * A quiet liveness signal while parsing; jumps instantly under reduced motion.
 */
function CountUp({ value, animate }: { value: number; animate: boolean }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    if (!animate) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / PDF_SCAN_TIMING.countUpDurationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  return <>{display.toLocaleString()}</>;
}

type PdfScanProgressSectionProps = {
  section: PdfImportSection;
  index: number;
  active: boolean;
  lit: boolean;
  complete: boolean;
  reduceMotion: boolean;
};

export function PdfScanProgressSection({
  section,
  index,
  active,
  lit,
  complete,
  reduceMotion,
}: PdfScanProgressSectionProps) {
  const { t } = useTranslation();
  const completionDelay = complete
    ? { transitionDelay: `${index * PDF_SCAN_TIMING.sectionStaggerMs}ms` }
    : undefined;

  return (
    <li
      key={section.key}
      className="relative flex h-10 items-center gap-3 rounded-lg px-3"
    >
      {active && !complete && (
        <motion.div
          layoutId="pdf-scanband"
          className="absolute inset-0 rounded-lg bg-sky-500/[0.08] ring-1 ring-inset ring-sky-500/25"
          transition={{ duration: PDF_SCAN_TIMING.activeBandLayoutDurationSec, ease: EASE_OUT_EXPO }}
        >
          {!reduceMotion && (
            <motion.span
              className="absolute inset-x-3 bottom-0 h-px bg-sky-400"
              animate={{ opacity: [0.25, 0.75, 0.25] }}
              transition={{
                duration: PDF_SCAN_TIMING.scanlinePulseDurationSec,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
      )}
      <span
        className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
          lit
            ? 'bg-sky-500 text-neutral-950'
            : active
              ? 'border border-sky-500/60'
              : 'border border-neutral-700'
        }`}
        style={completionDelay}
      >
        {lit && (
          <AnimatedCheckIcon
            draw={!reduceMotion}
            delay={complete ? index * PDF_SCAN_TIMING.sectionStaggerSec : 0}
            duration={PDF_SCAN_TIMING.checkDrawDurationSec}
          />
        )}
      </span>
      <span
        className={`relative z-10 text-sm transition-colors duration-200 ${
          lit ? 'text-neutral-100' : active ? 'text-sky-200' : 'text-neutral-500'
        }`}
        style={completionDelay}
      >
        {t(section.labelKey, { defaultValue: section.defaultLabel })}
      </span>
    </li>
  );
}

/**
 * PDF parse progress, "scanline" style: a sky band rides the active section (the
 * frontier of what's been parsed) while each section lights up — sky node + a
 * drawn check — as its data streams in. No spinner; the scan *is* the progress.
 */
export function PdfScanProgress({
  phase,
  charCount,
  litFields,
  complete,
}: {
  phase: PdfPhase;
  charCount: number;
  litFields: Set<string>;
  complete: boolean;
}) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion() ?? false;
  // The active row is the frontier: first section not yet lit. Anchored to real
  // progress — never a constant-speed fake sweep.
  const activeIndex = complete
    ? -1
    : PDF_IMPORT_SECTIONS.findIndex((section) => !litFields.has(section.key));

  const heading = complete
    ? t('importDialog.pdf.done', { defaultValue: '解析完成' })
    : phase === 'analyzing'
      ? t('importDialog.pdf.analyzing', { defaultValue: '解析中' })
      : t('importDialog.pdf.extracting', { defaultValue: '读取 PDF' });

  return (
    <div className="text-left">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-100">{heading}</span>
        {phase === 'analyzing' && !complete && charCount > 0 && (
          <span className="text-xs tabular-nums text-neutral-500">
            <CountUp value={charCount} animate={!reduceMotion} />{' '}
            {t('importDialog.pdf.charUnit', { defaultValue: '字' })}
          </span>
        )}
      </div>

      <ul className="relative flex flex-col gap-0.5">
        {/* Completion sweep: a single sky band runs down the whole list and fades. */}
        {complete && !reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-full rounded-lg bg-gradient-to-b from-transparent via-sky-500/10 to-transparent"
            initial={{ y: '-110%', opacity: 0.9 }}
            animate={{ y: '110%', opacity: 0 }}
            transition={{ duration: PDF_SCAN_TIMING.completionSweepDurationSec, ease: 'easeOut' }}
          />
        )}
        {PDF_IMPORT_SECTIONS.map((section, index) => {
          const lit = litFields.has(section.key) || complete;
          const active = index === activeIndex;
          return (
            <PdfScanProgressSection
              key={section.key}
              section={section}
              index={index}
              active={active}
              lit={lit}
              complete={complete}
              reduceMotion={reduceMotion}
            />
          );
        })}
      </ul>
    </div>
  );
}

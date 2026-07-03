import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * The workflow diorama: a live stream of AI proposals. Each card carries a
 * reason chip and a red-strike → green-add diff; it auto-accepts on a timer
 * (or the visitor clicks Accept/Skip), collapses into a committed row, and
 * every action lands in a mono audit ledger on the right. Loops forever.
 * Hover pauses. Mock data.
 */

type Item = { reason: string; before: string; after: string };
type Labels = {
  doc: string; status: string; proposal: string; reason: string;
  accept: string; skip: string; accepted: string; skipped: string;
  pending: string; upcoming: string; ledger: string; zeroLine: string;
  items: Item[];
};

type Verdict = 'pending' | 'accepted' | 'skipped';
const SPRING = { type: 'spring', stiffness: 420, damping: 30, mass: 0.9 } as const;

export default function ProposalStream({ labels }: { labels: Labels }) {
  const n = labels.items.length;
  const [idx, setIdx] = useState(0); // proposals before idx are decided
  const [verdicts, setVerdicts] = useState<Verdict[]>(() => Array(n).fill('pending'));
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const decide = (i: number, v: Verdict) => {
    setVerdicts((s) => s.map((x, k) => (k === i ? v : x)));
    setIdx(i + 1);
  };

  useEffect(() => {
    if (reduced || paused) return;
    if (idx < n) {
      timer.current = setTimeout(() => decide(idx, 'accepted'), 2600);
    } else {
      timer.current = setTimeout(() => {
        setVerdicts(Array(n).fill('pending'));
        setIdx(0);
      }, 3200);
    }
    return () => clearTimeout(timer.current);
  }, [idx, paused, reduced, n]);

  const acceptedCount = verdicts.filter((v) => v === 'accepted').length;
  const show = reduced ? n : idx; // reduced motion: everything committed

  return (
    <div
      role="group"
      aria-label={labels.status}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="linear-window grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[11px]"
    >
      {/* chrome */}
      <div className="linear-chrome flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
          </span>
          <span className="text-sky-300">{labels.status}</span>
          <span className="hidden font-mono text-[10px] text-faint sm:inline">· {labels.doc}</span>
        </div>
        <span className="font-mono text-[10px] tabular-nums text-faint">
          {labels.accepted} {acceptedCount}/{n}
        </span>
      </div>

      {/* fixed height: the loop rearranges inside, the frame never jitters */}
      <div className="grid h-[380px] min-h-0 md:h-[360px] md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
        {/* proposal feed */}
        <div className="min-h-0 space-y-3 overflow-hidden p-5">
          <AnimatePresence initial={false} mode="popLayout">
            {labels.items.map((item, i) => {
              if (reduced ? false : i > show) return null;
              const v = verdicts[i];
              const active = !reduced && i === show && v === 'pending';

              if (active) {
                return (
                  <motion.div
                    key={`card-${i}`}
                    layout
                    initial={{ opacity: 0, y: 22, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.14 } }}
                    transition={SPRING}
                    className="rounded-xl bg-paper p-3.5 text-paper-ink shadow-[0_14px_44px_-14px_rgb(0_0_0/0.8)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9.5px] uppercase tracking-wide text-paper-muted">
                        {labels.proposal} #{String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="rounded-md bg-sky-600/10 px-1.5 py-0.5 text-[9.5px] font-medium text-sky-700">
                        {labels.reason} · {item.reason}
                      </span>
                    </div>
                    <div className="mt-2 text-[12px] leading-relaxed">
                      <span className="text-del line-through decoration-del/60">{item.before}</span>{' '}
                      <span className="font-medium text-add">{item.after}</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      {/* auto-accept progress — pauses with hover */}
                      <div className="h-[3px] w-24 overflow-hidden rounded-full bg-black/10">
                        <motion.div
                          key={`bar-${i}-${paused}`}
                          initial={{ width: paused ? undefined : '0%' }}
                          animate={{ width: paused ? undefined : '100%' }}
                          transition={{ duration: 2.6, ease: 'linear' }}
                          className="h-full rounded-full bg-sky-500/70"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => decide(i, 'skipped')}
                          className="rounded-md px-2 py-1 text-[10.5px] font-medium text-paper-muted transition-colors hover:text-paper-ink"
                        >
                          {labels.skip}
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(i, 'accepted')}
                          className="rounded-md bg-[color:var(--color-add)] px-2.5 py-1 text-[10.5px] font-semibold text-white transition-opacity hover:opacity-85"
                        >
                          ✓ {labels.accept}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // committed row
              const skipped = v === 'skipped';
              return (
                <motion.div
                  key={`row-${i}`}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={SPRING}
                  className="linear-card flex items-center gap-2.5 rounded-lg px-3 py-2"
                >
                  <span className={`text-[11px] ${skipped ? 'text-faint' : 'text-[color:var(--color-add)]'}`}>
                    {skipped ? '⊘' : '✓'}
                  </span>
                  <span className={`min-w-0 flex-1 truncate text-[11px] ${skipped ? 'text-faint line-through' : 'text-ink/85'}`}>
                    {skipped ? item.before : item.after}
                  </span>
                  <span className="shrink-0 font-mono text-[9px] uppercase text-faint">
                    #{String(i + 1).padStart(2, '0')} {skipped ? labels.skipped : labels.accepted}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!reduced && show < n - 1 && (
            <div className="pl-1 pt-0.5 font-mono text-[9.5px] text-faint">
              {n - show - 1} {labels.upcoming}
            </div>
          )}
        </div>

        {/* audit ledger */}
        <div className="linear-pane hidden min-h-0 flex-col border-l border-white/[0.055] p-5 md:flex">
          <div className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-faint">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
            {labels.ledger}
          </div>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden font-mono text-[10px] leading-relaxed">
            <AnimatePresence initial={false}>
              {labels.items.map((item, i) => {
                const v = verdicts[i];
                if (!reduced && (i >= show || v === 'pending')) return null;
                const skipped = v === 'skipped';
                return (
                  <motion.div
                    key={`log-${i}-${v}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={SPRING}
                    className="flex items-center gap-2"
                  >
                    <span className="text-faint">00:{String(3 + i * 4).padStart(2, '0')}</span>
                    <span className={skipped ? 'text-amber-400/80' : 'text-[color:var(--color-add)]'}>
                      {skipped ? '⊘' : '✓'}
                    </span>
                    <span className="truncate text-muted">
                      {labels.proposal.toLowerCase()} #{String(i + 1).padStart(2, '0')} · {skipped ? labels.skipped : labels.accepted} · {item.reason}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {!reduced && idx < n && (
              <div className="flex items-center gap-2">
                <span className="text-faint">00:{String(3 + idx * 4).padStart(2, '0')}</span>
                <span className="inline-flex gap-0.5">
                  {[0, 140, 280].map((d) => (
                    <span key={d} className="h-1 w-1 animate-pulse rounded-full bg-faint" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
                <span className="text-faint">{labels.pending}</span>
              </div>
            )}
          </div>
          <div className="linear-card mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-sky-300">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/></svg>
            {labels.zeroLine}
          </div>
        </div>
      </div>
    </div>
  );
}

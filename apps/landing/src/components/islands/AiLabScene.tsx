import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Full-width interactive AI Lab scene (Linear-style DOM diorama, mock data).
 * Left: a real chat — skill chips play scripted flows, free-typed messages get
 * a canned demo reply. Right: the live canvas reacts (rewrite / gaps / flip /
 * highlight) and can be collapsed; sending anything auto-opens it.
 */

type Chip = { id: string; tag: string; ask: string; label: string };
type Labels = {
  window: { title: string; doc: string; liveCanvas: string; stop: string };
  welcome: { title: string; sub: string; hint: string; placeholder: string };
  chat: { mockReply: string; send: string; menuTitle: string; toggleCanvas: string };
  chips: Chip[];
  flows: {
    optimize: {
      reply: string; formTitle: string; jd: string; jdPh: string; company: string;
      companyPh: string; role: string; rolePh: string; cancel: string; submit: string; applied: string;
    };
    analyze: { cardTitle: string; steps: string[]; result: string };
    translate: { reply: string };
    interview: { reply: string; question: string; hint: string };
  };
};

type Msg = {
  id: number;
  kind: 'user' | 'text' | 'typing' | 'form' | 'applied' | 'analyze' | 'result' | 'question';
  tag?: string;
  text?: string;
};

const TAG_STYLE: Record<string, string> = {
  optimize: 'bg-purple-400/15 text-purple-300',
  analyze: 'bg-emerald-400/15 text-emerald-300',
  translate: 'bg-sky-400/15 text-sky-300',
  interview: 'bg-amber-400/15 text-amber-300',
};

const HEADINGS = {
  en: { exp: 'Work Experience', edu: 'Education', proj: 'Projects', skills: 'Skills' },
  zh: { exp: '工作经历', edu: '教育经历', proj: '项目经历', skills: '专业技能' },
};

const BD_BULLET_BASE = 'Worked on the global creator platform’s frontend.';
const BD_BULLET_UPGRADED =
  'Architected an LLM-driven Design-to-Code tool, generating React components from Figma with 95%+ UI fidelity.';

const EASE = [0.22, 1, 0.36, 1] as const;

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin text-sky-400" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M12 3a9 9 0 1 1-9 9" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint"
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}

/* ------------------------------ paper canvas ----------------------------- */

function Paper({
  headingLang, upgraded, flash, gaps, probe,
}: {
  headingLang: 'en' | 'zh';
  upgraded: boolean;
  flash: boolean;
  gaps: boolean;
  probe: boolean;
}) {
  const H = HEADINGS[headingLang];
  const Heading = ({ text }: { text: string }) => (
    <div className="mt-[8px] border-b border-sky-600/40 pb-[2px] text-[7px] font-bold text-[#2563eb]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={text}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="inline-block"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
  const Row = ({ l, r }: { l: string; r: string }) => (
    <div className="mt-[3px] flex items-baseline justify-between gap-2">
      <span className="text-[7px] font-bold">{l}</span>
      <span className="text-[6.4px] text-paper-muted">{r}</span>
    </div>
  );

  return (
    <div className="mx-auto h-full w-full max-w-[420px] overflow-hidden rounded-[3px] bg-paper px-5 py-4 font-serif text-paper-ink shadow-[0_18px_60px_-16px_rgb(0_0_0/0.85)]">
      <div className="text-[12px] font-bold tracking-tight">Kairo Chen</div>
      <div className="text-[6.6px] text-paper-muted">
        MIT Computer Science | Frontend Engineer Enthusiast | Seeking 2026 Full-time Roles
      </div>
      <div className="text-[6.2px] text-paper-muted">
        +1 (617) 000-0000 · kairo.chen@mit.edu · Cambridge, MA · kairo.mit.edu
      </div>

      <Heading text={H.exp} />
      <Row l="Google" r="2025.06 ~ 2025.09 · Software Engineering Intern (Cloud)" />
      <ul className="mt-[2px] space-y-[2px]">
        <li
          className={`text-[6.6px] leading-[1.5] text-paper-ink/85 transition-all duration-500 ${
            probe ? 'rounded-sm bg-amber-200/70 px-1 ring-1 ring-amber-400/70' : ''
          }`}
        >
          · Refactored critical resource-monitoring dashboards using Angular and RxJS, reducing memory leaks by 25%.
        </li>
        <li className="text-[6.6px] leading-[1.5] text-paper-ink/85">
          · Developed a specialized Web Worker layer for multi-threaded telemetry, preventing main-thread blocking.
        </li>
      </ul>
      <Row l="ByteDance (TikTok)" r="2024.11 ~ 2025.05 · Frontend Engineering Intern" />
      <ul className="mt-[2px] space-y-[2px]">
        <li
          className={`text-[6.6px] leading-[1.5] transition-all duration-500 ${
            flash
              ? 'font-semibold text-add'
              : gaps
                ? 'rounded-sm bg-amber-200/60 px-1 text-paper-ink/85 ring-1 ring-amber-400/60'
                : 'text-paper-ink/85'
          }`}
        >
          · {upgraded ? BD_BULLET_UPGRADED : BD_BULLET_BASE}
        </li>
        <li className="text-[6.6px] leading-[1.5] text-paper-ink/85">
          · Optimized global asset delivery via Edge Computing, reducing FCP by 40% in low-bandwidth regions.
        </li>
      </ul>

      <Heading text={H.edu} />
      <Row l="Massachusetts Institute of Technology (MIT)" r="2022.09 ~ 2026.06 · B.S." />
      <div className="mt-[2px] text-[6.6px] leading-[1.5] text-paper-ink/85">
        GPA 4.9/5.0 · 6.031 Software Construction · 6.824 Distributed Systems · Eta Kappa Nu (HKN)
      </div>

      <Heading text={H.proj} />
      <Row l="Nebula-Flow: High-Performance Low-Code Engine" r="2024.08 ~ 2025.01 · Lead Maintainer" />
      <ul className="mt-[2px] space-y-[2px]">
        <li className="text-[6.6px] leading-[1.5] text-paper-ink/85">
          · Designed a Proxy-based JavaScript Sandbox to safely execute user-defined logic in full isolation.
        </li>
        <li className="text-[6.6px] leading-[1.5] text-paper-ink/85">
          · Implemented a CRDT-based collaborative engine (Yjs) for conflict-free simultaneous editing.
        </li>
      </ul>

      <Heading text={H.skills} />
      <div className="mt-[2px] space-y-[1.5px]">
        {[
          ['React 18, Next.js, TypeScript', 'Expert'],
          ['High-performance Visualization', 'Proficient'],
          ['LLM orchestration', 'Hands-on experience'],
        ].map(([k, v]) => (
          <div
            key={k}
            className={`flex items-baseline justify-between text-[6.6px] transition-all duration-500 ${
              gaps && k === 'LLM orchestration' ? 'rounded-sm bg-amber-200/60 px-1 ring-1 ring-amber-400/60' : ''
            }`}
          >
            <span className="font-semibold text-paper-ink/90">{k}</span>
            <span className="text-paper-muted">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- scene --------------------------------- */

export default function AiLabScene({ labels, lang }: { labels: Labels; lang: 'en' | 'zh' }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [flow, setFlow] = useState<string>('welcome');
  const [canvasOpen, setCanvasOpen] = useState(true);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [fx, setFx] = useState({ upgraded: false, flash: false, gaps: false, probe: false, flipped: false });
  const [input, setInput] = useState('');
  const [selIdx, setSelIdx] = useState(0);

  // "/" opens the skill menu; anything typed after it filters the list
  const slash = input.trimStart().startsWith('/');
  const query = slash ? input.trimStart().slice(1).trim().toLowerCase() : '';
  const menuItems = slash
    ? labels.chips.filter((c) => !query || `${c.label}${c.tag}`.toLowerCase().includes(query))
    : [];

  const idRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const F = labels.flows;
  const otherLang = lang === 'zh' ? 'en' : 'zh';

  const nid = () => ++idRef.current;
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  useEffect(() => clearTimers, []);

  // keep the newest message in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, analyzeStep]);

  // analyze: advance one review step at a time, then flag gaps + result
  useEffect(() => {
    if (flow !== 'analyze') return;
    if (analyzeStep < F.analyze.steps.length) {
      const t = setTimeout(() => setAnalyzeStep((s) => s + 1), analyzeStep === 0 ? 500 : 800);
      return () => clearTimeout(t);
    }
    setFx((f) => (f.gaps ? f : { ...f, gaps: true }));
    setMessages((m) =>
      m.some((x) => x.kind === 'result') ? m : [...m, { id: nid(), kind: 'result' }],
    );
  }, [flow, analyzeStep, F.analyze.steps.length]);

  const replaceTyping = (add: Msg[]) =>
    setMessages((m) => [...m.filter((x) => x.kind !== 'typing'), ...add]);

  const startFlow = (chip: Chip) => {
    clearTimers();
    setFlow(chip.id);
    setCanvasOpen(true);
    setAnalyzeStep(0);
    setFx({ upgraded: false, flash: false, gaps: false, probe: false, flipped: false });
    // real conversational rhythm: user pops first → thinking dots → answer
    setMessages([{ id: nid(), kind: 'user', tag: chip.tag, text: chip.ask }]);
    later(() => setMessages((m) => [...m, { id: nid(), kind: 'typing' }]), 420);
    later(() => {
      if (chip.id === 'optimize') {
        replaceTyping([
          { id: nid(), kind: 'text', text: F.optimize.reply },
          { id: nid(), kind: 'form' },
        ]);
      } else if (chip.id === 'analyze') {
        replaceTyping([{ id: nid(), kind: 'analyze' }]);
      } else if (chip.id === 'translate') {
        replaceTyping([{ id: nid(), kind: 'text', text: F.translate.reply }]);
        setFx((f) => ({ ...f, flipped: true }));
      } else if (chip.id === 'interview') {
        replaceTyping([
          { id: nid(), kind: 'text', text: F.interview.reply },
          { id: nid(), kind: 'question' },
        ]);
        setFx((f) => ({ ...f, probe: true }));
      }
    }, 1500);
  };

  const pick = (chip: Chip) => {
    setInput('');
    setSelIdx(0);
    startFlow(chip);
  };

  const send = () => {
    if (slash) {
      if (menuItems.length) pick(menuItems[Math.min(selIdx, menuItems.length - 1)]);
      return;
    }
    const text = input.trim();
    if (!text) return;
    clearTimers();
    setInput('');
    setCanvasOpen(true);
    setMessages((m) => [
      ...m.filter((x) => x.kind !== 'typing'),
      { id: nid(), kind: 'user', text },
    ]);
    later(() => setMessages((m) => [...m, { id: nid(), kind: 'typing' }]), 420);
    later(() => replaceTyping([{ id: nid(), kind: 'text', text: labels.chat.mockReply }]), 1600);
  };

  const applyOptimize = () => {
    setMessages((m) => [...m.filter((x) => x.kind !== 'form'), { id: nid(), kind: 'applied' }]);
    setFx((f) => ({ ...f, upgraded: true, flash: true }));
    later(() => setFx((f) => ({ ...f, flash: false })), 1800);
  };

  const cancelOptimize = () => {
    clearTimers();
    setFlow('welcome');
    setMessages([]);
  };

  const analyzeDone = analyzeStep >= F.analyze.steps.length;

  const renderMsg = (m: Msg) => {
    if (m.kind === 'user') {
      return (
        <div className="flex justify-end">
          <div className="linear-card flex max-w-[92%] items-center gap-1.5 rounded-lg px-2.5 py-1.5">
            {m.tag && (
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium ${TAG_STYLE[flow] ?? 'bg-sky-400/15 text-sky-300'}`}>
                {m.tag}
              </span>
            )}
            <span className="text-[10.5px] text-ink/90">{m.text}</span>
          </div>
        </div>
      );
    }

    const body = (() => {
      switch (m.kind) {
        case 'typing':
          return <TypingDots />;
        case 'text':
          return <p className="text-[10.5px] leading-relaxed text-muted">{m.text}</p>;
        case 'applied':
          return (
            <p className="text-[10.5px] leading-relaxed text-ink/85">
              <span className="mr-1 text-[color:var(--color-add)]">✓</span>
              {F.optimize.applied}
            </p>
          );
        case 'question':
          return (
            <div className="space-y-1.5">
              <div className="rounded-lg bg-amber-400/8 p-2.5 text-[10.5px] leading-relaxed text-amber-200/90 ring-1 ring-amber-400/20">
                {F.interview.question}
              </div>
              <p className="text-[9.5px] text-faint">{F.interview.hint}</p>
            </div>
          );
        case 'form':
          return (
            <div className="linear-card rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink">
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded bg-sky-400/10 text-[8px] text-sky-400">▤</span>
                {F.optimize.formTitle}
              </div>
              <div className="mt-2 text-[8.5px] text-faint">{F.optimize.jd}</div>
              <div className="linear-field mt-1 h-12 rounded-md px-2 py-1.5 text-[9px] text-faint">
                {F.optimize.jdPh}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[[F.optimize.company, F.optimize.companyPh], [F.optimize.role, F.optimize.rolePh]].map(([l, ph]) => (
                  <div key={l}>
                    <div className="text-[8.5px] text-faint">{l}</div>
                    <div className="linear-field mt-1 truncate rounded-md px-2 py-1 text-[9px] text-faint">
                      {ph}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex justify-end gap-2">
                <button type="button" onClick={cancelOptimize} className="rounded-md px-2 py-1 text-[9.5px] text-faint transition-colors hover:text-muted">
                  {F.optimize.cancel}
                </button>
                <button type="button" onClick={applyOptimize} className="rounded-md bg-sky-500 px-2.5 py-1 text-[9.5px] font-semibold text-white transition-colors hover:bg-sky-400">
                  ✓ {F.optimize.submit}
                </button>
              </div>
            </div>
          );
        case 'analyze':
          return (
            <div className="space-y-2">
              <div className="linear-card rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-semibold text-ink">{F.analyze.cardTitle}</span>
                  <span className="font-mono text-[9px] text-faint">
                    {Math.min(analyzeStep + 1, F.analyze.steps.length)}/{F.analyze.steps.length}
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {F.analyze.steps.map((s, i) => (
                    <li key={s} className="flex items-center gap-2 text-[10px]">
                      {i < analyzeStep ? (
                        <span className="text-[color:var(--color-add)]">✓</span>
                      ) : i === analyzeStep ? (
                        <Spinner />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full border border-hairline" />
                      )}
                      <span className={i <= analyzeStep ? 'text-ink/85' : 'text-faint'}>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {!analyzeDone && (
                <div className="flex justify-center">
                  <span className="rounded-full border border-hair px-2.5 py-1 text-[9.5px] text-faint">
                    ◎ {labels.window.stop}
                  </span>
                </div>
              )}
            </div>
          );
        case 'result':
          return (
            <p className="text-[10.5px] leading-relaxed text-ink/85">
              <span className="mr-1 text-[color:var(--color-add)]">✓</span>
              {F.analyze.result}
            </p>
          );
      }
    })();

    // cards read as canvas objects, not chat lines — no bot icon, full width
    if (m.kind === 'form' || m.kind === 'analyze') return body;

    const center = m.kind === 'typing';
    return (
      <div className={`flex gap-2 ${center ? 'items-center' : ''}`}>
        <span className={`shrink-0 select-none text-[11px] text-sky-400 ${center ? '' : 'mt-0.5'}`}>✦</span>
        <div className="min-w-0 flex-1">{body}</div>
      </div>
    );
  };

  return (
    <div
      role="group"
      aria-label={labels.window.title}
      className="linear-window grid h-[560px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[11px] text-left lg:h-[600px] xl:h-[620px]"
    >
      {/* window chrome */}
      <div className="linear-chrome flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/20">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 3v6.5L5.2 17A2 2 0 0 0 7 20h10a2 2 0 0 0 1.8-3L14 9.5V3M8 14h8"/></svg>
          </span>
          <span className="text-[12px] font-semibold text-ink">{labels.window.title}</span>
          <span className="hidden items-center gap-1 rounded-full border border-hair px-2 py-0.5 text-[10px] text-muted sm:flex">
            ▤ {labels.window.doc}
          </span>
        </div>
        <div className="flex items-center gap-2 text-faint">
          <button
            type="button"
            onClick={() => setCanvasOpen((o) => !o)}
            aria-pressed={canvasOpen}
            aria-label={labels.chat.toggleCanvas}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-all duration-300 ${
              canvasOpen
                ? 'border-sky-400/25 bg-sky-400/8 text-sky-300'
                : 'border-hair text-faint hover:text-muted'
            }`}
          >
            ⚡ {labels.window.liveCanvas}
          </button>
          <span className="text-[11px]">✎</span>
          <span className="text-[11px]">✕</span>
        </div>
      </div>

      {/* body — canvas column springs open/closed */}
      <div className="flex min-h-0">
        {/* chat column */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-5 xl:p-6">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-[18px] text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/25">
                    ✦
                  </span>
                  <div className="mt-4 text-[15px] font-semibold text-ink">{labels.welcome.title}</div>
                  <div className="mt-1.5 text-[11px] text-muted">{labels.welcome.sub}</div>
                  <div className="mt-5 flex items-center gap-1.5 text-[10px] text-faint">
                    <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted">/</kbd>
                    {labels.welcome.hint}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="thread"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {/* popLayout pops exiting items (typing dots) out of flow so
                      replacements spring into place without a layout jump */}
                  <AnimatePresence initial={false} mode="popLayout">
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.12 } }}
                        transition={{ type: 'spring', stiffness: 460, damping: 30, mass: 0.9 }}
                        style={{ transformOrigin: m.kind === 'user' ? '90% 100%' : '8% 100%' }}
                      >
                        {renderMsg(m)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* input + slash skill menu */}
          <div className="relative p-4 xl:p-5">
            <AnimatePresence>
              {menuItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="absolute inset-x-3 bottom-full z-10 mb-1.5 overflow-hidden rounded-xl bg-surface-2 py-1 shadow-2xl shadow-black/60 ring-1 ring-white/[0.06]"
                >
                  <div className="px-3 pb-1 pt-1.5 text-[9px] font-medium uppercase tracking-wider text-faint">
                    {labels.chat.menuTitle}
                  </div>
                  {menuItems.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseEnter={() => setSelIdx(i)}
                      onClick={() => pick(c)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                        i === selIdx ? 'bg-white/[0.06]' : ''
                      }`}
                    >
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-medium ${TAG_STYLE[c.id]}`}>
                        {c.tag}
                      </span>
                      <span className="truncate text-[11px] text-ink/90">{c.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 rounded-xl bg-white/[0.04] py-1.5 pl-3 pr-1.5 ring-1 ring-white/[0.07] transition-shadow focus-within:ring-sky-400/40"
            >
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setSelIdx(0);
                }}
                onKeyDown={(e) => {
                  if (!menuItems.length) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelIdx((i) => (i + 1) % menuItems.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelIdx((i) => (i - 1 + menuItems.length) % menuItems.length);
                  } else if (e.key === 'Escape') {
                    setInput('');
                  }
                }}
                placeholder={labels.welcome.placeholder}
                className="min-w-0 flex-1 bg-transparent text-[11px] text-ink placeholder:text-faint focus:outline-none"
              />
              <button
                type="submit"
                aria-label={labels.chat.send}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 ${
                  input.trim() ? 'bg-sky-500 hover:bg-sky-400' : 'bg-sky-500/40'
                }`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
              </button>
            </form>
          </div>
        </div>

        {/* live canvas — width driven by a physical spring */}
        <motion.div
          initial={false}
          animate={{ width: canvasOpen ? '52%' : '0%' }}
          transition={{ type: 'spring', stiffness: 230, damping: 26, mass: 1 }}
          className="linear-pane hidden min-h-0 min-w-0 overflow-hidden border-l border-white/[0.055] md:block"
        >
          {/* fixed min-width so the paper clips instead of squishing mid-flight */}
          <motion.div
            initial={false}
            animate={{ x: canvasOpen ? 0 : 32, opacity: canvasOpen ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 230, damping: 28, mass: 1 }}
            className="h-full min-w-[480px] p-5 xl:p-6"
          >
            <Paper
              headingLang={fx.flipped ? otherLang : lang}
              upgraded={fx.upgraded}
              flash={fx.flash}
              gaps={fx.gaps}
              probe={fx.probe}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

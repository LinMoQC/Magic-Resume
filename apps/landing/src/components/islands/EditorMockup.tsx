import { useState } from 'react';

/**
 * High-fidelity DOM recreation of the real Magic Resume editor (the Linear
 * approach: drawn, not screenshotted — crisp at any DPR and interactive).
 * Mock data mirrors the actual product: icon rail / content pane / paper
 * canvas with zoom toolbar + AI orb / customize pane / tool rail.
 */

type Labels = {
  doc: string;
  synced: string;
  content: string;
  basics: string;
  avatar: string;
  name: string;
  title: string;
  email: string;
  website: string;
  phone: string;
  location: string;
  experience: string;
  customize: string;
  template: string;
  layout: string;
  typography: string;
  colors: string;
  quickThemes: string;
  customColors: string;
  primary: string;
  secondary: string;
  changeTemplate: string;
  proposal: string;
  proposalHint: string;
  accept: string;
  skip: string;
};

/* ------------------------------- icons ---------------------------------- */

const PATHS: Record<string, string> = {
  person: 'M12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20a7 7 0 0 1 14 0',
  briefcase:
    'M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9zM9 7V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M4 13h16',
  gradcap: 'M12 4l10 5-10 5L2 9l10-5zM6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
  zap: 'M13 2L4 14h6l-1 8 9-12h-6l1-8z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  columns: 'M4 4h6.5v16H4zM13.5 4H20v16h-6.5z',
  typeT: 'M5 6V4h14v2M12 4v16M9 20h6',
  palette:
    'M12 3a9 9 0 0 0 0 18c1.4 0 2-.9 2-1.8 0-.9-.6-1.4-1.1-1.9-.7-.8 0-1.8 1.4-1.8H17a5 5 0 0 0 5-5c0-4.2-4.5-7.5-10-7.5z',
  chevUp: 'M6 14.5l6-6 6 6',
  chevDown: 'M6 9.5l6 6 6-6',
  back: 'M14.5 5.5L8 12l6.5 6.5',
  history: 'M4.5 11.5a8 8 0 1 1 2.2 6M4.5 5.5v5h5M12 8v4.5l3 2',
  comment: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H10l-6 5V7z',
  zoomOut: 'M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 11h5M20 20l-4.5-4.5',
  zoomIn: 'M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 11h5M11 8.5v5M20 20l-4.5-4.5',
  reset: 'M4.5 12a8 8 0 1 0 2.3-5.7M4.5 4.5v4.8h4.8',
  download: 'M12 4v10M7.5 10L12 14.5 16.5 10M5 19h14',
  fileText: 'M7 3h7l4 4v14H7V3zM14 3v4h4M10 12h5M10 15.5h5',
  share: 'M13.5 4.5H20V11M19.5 5L11 13.5M17 13v6H5V7h6',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  wrench:
    'M14.5 6.5a4 4 0 0 0-5.7 4.6L3.5 16.5 7 20l5.4-5.3a4 4 0 0 0 4.6-5.7L14 12l-3-3 3.5-2.5z',
  langs: 'M3 6h9M7.5 4v2M10 6c0 4-3.5 7-7 8M5 9c0 2 2 3.5 5 4.5M13 20l4-9 4 9M14.5 17h5',
  award: 'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 13L7 21l5-2.5L17 21l-1.5-8',
  phone:
    'M5 4h4l1.5 4-2 1.5a12 12 0 0 0 6 6L16 13.5l4 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  mail: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zM3 7l9 6 9-6',
  pin: 'M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
};

function Ic({ d, s = 14, sw = 1.6, className }: { d: string; s?: number; sw?: number; className?: string }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[d]} />
    </svg>
  );
}

/* ------------------------------ mock data -------------------------------- */

const QUICK = ['#3B82F6', '#0EA5E9', '#22C55E', '#A855F7', '#F97316', '#475569'];
const DOTS = [
  '#3B82F6', '#0EA5E9', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#F59E0B', '#22C55E', '#14B8A6', '#1E3A8A', '#64748B', '#6B7280', '#1F2937', '#000000',
];

const TEMPLATES = [
  {
    id: 'classic', name: 'Classic', serif: true, sidebar: false, banded: false,
    tags: ['classic', 'serif', 'professional', 'ats-friendly'],
    desc: {
      en: 'A classic and professional serif-font template, ideal for academic and formal roles',
      zh: 'A classic and professional serif-font template, ideal for academic and formal roles',
    },
  },
  {
    id: 'azurill', name: 'Azurill', serif: false, sidebar: true, banded: false,
    tags: ['modern', 'two-column', 'compact'],
    desc: {
      en: 'A modern two-column layout with a tinted sidebar for dense information',
      zh: '现代双栏布局,侧栏点缀主题色,信息密度更高',
    },
  },
  {
    id: 'bronzor', name: 'Bronzor', serif: false, sidebar: false, banded: false,
    tags: ['minimal', 'clean', 'ats-friendly'],
    desc: {
      en: 'A minimal single-column template with generous whitespace',
      zh: '极简单栏模板,留白充足,呼吸感强',
    },
  },
  {
    id: 'chikorita', name: 'Chikorita', serif: false, sidebar: false, banded: true,
    tags: ['fresh', 'banner', 'creative'],
    desc: {
      en: 'A fresh template with an accent banner, distinctive at first glance',
      zh: '顶部主题色带设计,清新亮眼有辨识度',
    },
  },
] as const;

const BULLET_BEFORE = 'Refactored critical resource-monitoring dashboards using Angular and RxJS.';
const BULLET_AFTER =
  'Refactored critical resource-monitoring dashboards using Angular and RxJS, reducing memory leaks by 25%.';

const HEADINGS = {
  en: { exp: 'Work Experience', edu: 'Education', proj: 'Projects', skills: 'Skills', langs: 'Languages', certs: 'Certifications' },
  zh: { exp: '工作经历', edu: '教育经历', proj: '项目经历', skills: '专业技能', langs: '语言能力', certs: '证书资质' },
};

/* ------------------------------ sub-parts -------------------------------- */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-[3px] text-[8.5px] text-faint">{label}</div>
      <div className="linear-field truncate rounded-[5px] px-2 py-[5px] text-[9.5px] text-ink/80">
        {value}
      </div>
    </div>
  );
}

function PanelHead({ icon, label, open = true }: { icon: string; label: string; open?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-sky-400/10 text-sky-400 ring-1 ring-sky-400/15">
          <Ic d={icon} s={11} />
        </span>
        <span className="text-[10.5px] font-semibold text-ink/90">{label}</span>
      </div>
      <span className="text-faint">
        <Ic d={open ? 'chevUp' : 'chevDown'} s={10} />
      </span>
    </div>
  );
}

function PaperHeading({ icon, text, accent }: { icon: string; text: string; accent: string }) {
  return (
    <div
      className="mt-[7px] flex items-center gap-1 border-b pb-[2px] text-[6.8px] font-bold transition-colors duration-300"
      style={{ color: accent, borderColor: `color-mix(in srgb, ${accent} 45%, transparent)` }}
    >
      <Ic d={icon} s={7} sw={2.2} />
      {text}
    </div>
  );
}

function Entry({
  l1, r1, l2, r2, serif,
}: { l1: string; r1: string; l2?: string; r2?: string; serif?: boolean }) {
  return (
    <div className="mt-[4px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[6.8px] font-bold">{l1}</span>
        <span className="text-[6.2px] text-paper-muted">{r1}</span>
      </div>
      {(l2 || r2) && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[6.2px] text-paper-muted">{l2}</span>
          <span className={`text-[6.2px] text-paper-muted ${serif ? 'italic' : ''}`}>{r2}</span>
        </div>
      )}
    </div>
  );
}

function Bullets({ items, flash }: { items: (string | { text: string; flash: boolean })[]; flash?: boolean }) {
  void flash;
  return (
    <ul className="mt-[2px] space-y-[1.5px]">
      {items.map((it, i) => {
        const text = typeof it === 'string' ? it : it.text;
        const hot = typeof it !== 'string' && it.flash;
        return (
          <li
            key={i}
            className={`text-[6.3px] leading-[1.45] transition-colors duration-500 ${
              hot ? 'font-semibold text-add' : 'text-paper-ink/85'
            }`}
          >
            · {text}
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------- main ----------------------------------- */

export default function EditorMockup({ labels, lang }: { labels: Labels; lang: 'en' | 'zh' }) {
  const [accent, setAccent] = useState<string>(QUICK[0]);
  const [tplIdx, setTplIdx] = useState(0);
  const [proposal, setProposal] = useState<'idle' | 'open' | 'accepted' | 'settled'>('idle');

  const tpl = TEMPLATES[tplIdx];
  const H = HEADINGS[lang];
  const accepted = proposal === 'accepted' || proposal === 'settled';

  const acceptProposal = () => {
    setProposal('accepted');
    setTimeout(() => setProposal('settled'), 1600);
  };

  return (
    <div
      role="group"
      aria-label={labels.doc}
      className="linear-window grid h-[460px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[11px] text-left sm:h-[520px] lg:h-[600px] xl:h-[620px]"
    >
      {/* ── top bar ─────────────────────────────────────────────────────── */}
      <div className="linear-chrome grid grid-cols-[1fr_auto_1fr] items-center px-3.5 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="hidden text-faint sm:block"><Ic d="back" s={12} /></span>
        </div>
        <span className="text-[11px] font-medium text-ink/85">{labels.doc}</span>
        <div className="flex items-center justify-end gap-3 text-faint">
          <Ic d="history" s={12} />
          <Ic d="comment" s={12} />
          <span className="flex items-center gap-1 text-[10px] text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            {labels.synced}
          </span>
        </div>
      </div>

      {/* ── body ────────────────────────────────────────────────────────── */}
      <div className="grid min-h-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[44px_260px_minmax(0,1fr)_260px_44px] xl:grid-cols-[48px_300px_minmax(0,1fr)_300px_48px]">
        {/* left icon rail */}
        <aside className="hidden min-h-0 flex-col items-center gap-1.5 border-r border-hair py-4 lg:flex">
          {(['person', 'briefcase', 'gradcap', 'folder', 'zap', 'globe'] as const).map((ic, i) => (
            <span
              key={ic}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                i === 0 ? 'bg-sky-400/12 text-sky-400 ring-1 ring-sky-400/25' : 'text-faint'
              }`}
            >
              <Ic d={ic} s={13} />
            </span>
          ))}
          <span className="mt-auto h-7 w-7 rounded-full bg-gradient-to-br from-sky-300 via-indigo-400 to-fuchsia-400" />
        </aside>

        {/* content panel */}
        <aside className="hidden min-h-0 flex-col gap-3.5 overflow-hidden border-r border-hair p-4 xl:p-5 lg:flex">
          <div className="text-[11.5px] font-semibold text-ink">{labels.content}</div>

          <PanelHead icon="person" label={labels.basics} />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-faint ring-1 ring-white/10">
              <Ic d="person" s={13} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-[3px] text-[8.5px] text-faint">{labels.avatar}</div>
              <div className="linear-field truncate rounded-[5px] px-2 py-[5px] text-[9.5px] text-faint">
                https://...
              </div>
            </div>
          </div>
          <Field label={labels.name} value="Kairo Chen" />
          <Field label={labels.title} value="MIT Computer Science | Frontend Engineer Ent" />
          <Field label={labels.email} value="kairo.chen@mit.edu" />
          <Field label={labels.website} value="kairo.mit.edu" />
          <Field label={labels.phone} value="+1 (617) 000-0000" />

          <PanelHead icon="briefcase" label={labels.experience} />
          <div className="linear-card flex items-center gap-2 rounded-lg p-2.5">
            <span className="text-faint tracking-tighter">⋮⋮</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-semibold text-ink/90">Google</div>
              <div className="truncate text-[8.5px] text-faint">Mountain View, CA</div>
            </div>
            <span className="text-faint"><Ic d="more" s={12} sw={2.4} /></span>
          </div>
        </aside>

        {/* paper canvas */}
        <div className="linear-pane relative min-h-0 overflow-hidden px-5 py-5 sm:px-9 xl:px-11">
          <div
            className={`mx-auto flex h-full max-w-[440px] overflow-hidden rounded-[3px] bg-paper text-paper-ink shadow-[0_18px_60px_-16px_rgb(0_0_0/0.85)] xl:max-w-[470px] ${
              tpl.serif ? 'font-serif' : ''
            }`}
          >
            {tpl.sidebar && (
              <div
                className="w-11 shrink-0 px-1.5 py-3"
                style={{ background: `color-mix(in srgb, ${accent} 12%, white)` }}
              >
                <div
                  className="mx-auto h-6 w-6 rounded-full text-center text-[10px] font-bold leading-6 text-white"
                  style={{ background: accent }}
                >
                  K
                </div>
                <div className="mt-2 space-y-[3px]">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[2.5px] rounded-full bg-black/10" />
                  ))}
                </div>
              </div>
            )}

            <div className="min-w-0 flex-1">
              {tpl.banded && <div className="h-[5px]" style={{ background: accent }} />}
              <div className={`px-4 py-3 ${tpl.id === 'classic' ? 'text-center' : ''}`}>
                {/* header */}
                <div className="text-[11.5px] font-bold tracking-tight">Kairo Chen</div>
                <div className="text-[6.3px] text-paper-muted">
                  MIT Computer Science | Frontend Engineer Enthusiast | Seeking 2026 Full-time Roles
                </div>
                <div
                  className={`mt-[2px] flex flex-wrap items-center gap-x-2 gap-y-[1px] text-[6px] text-paper-muted ${
                    tpl.id === 'classic' ? 'justify-center' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-[2px]"><Ic d="phone" s={6} sw={2.4} />+1 (617) 000-0000</span>
                  <span className="inline-flex items-center gap-[2px]"><Ic d="mail" s={6} sw={2.4} />kairo.chen@mit.edu</span>
                  <span className="inline-flex items-center gap-[2px]"><Ic d="pin" s={6} sw={2.4} />Cambridge, MA</span>
                  <span className="inline-flex items-center gap-[2px]"><Ic d="globe" s={6} sw={2.4} />kairo.mit.edu</span>
                </div>

                <div className="text-left">
                  {/* experience */}
                  <PaperHeading icon="briefcase" text={H.exp} accent={accent} />
                  <Entry l1="Google" r1="2025.06 ~ 2025.09" l2="Mountain View, CA" r2="Software Engineering Intern (Cloud)" serif={tpl.serif} />
                  <div className="mt-[2px] text-[6.4px] font-semibold text-paper-ink/90">Google Cloud Console UI Optimization</div>
                  <Bullets
                    items={[
                      { text: accepted ? BULLET_AFTER : BULLET_BEFORE, flash: proposal === 'accepted' },
                      'Developed a specialized Web Worker layer to handle multi-threaded telemetry data processing, preventing main-thread blocking during peak load.',
                    ]}
                  />
                  <Entry l1="ByteDance (TikTok)" r1="2024.11 ~ 2025.05" l2="Los Angeles / Remote" r2="Frontend Engineering Intern" serif={tpl.serif} />
                  <div className="mt-[2px] text-[6.4px] font-semibold text-paper-ink/90">Global Creator Platform (DOU+)</div>
                  <Bullets
                    items={[
                      'Architected an LLM-driven D2C (Design-to-Code) tool, enabling one-click React component generation from Figma links with 95%+ UI fidelity.',
                      'Optimized global asset delivery via Edge Computing (Cloudflare Workers), reducing FCP by 40% for creators in low-bandwidth regions.',
                    ]}
                  />

                  {/* education */}
                  <PaperHeading icon="gradcap" text={H.edu} accent={accent} />
                  <Entry l1="Massachusetts Institute of Technology (MIT)" r1="2022.09 ~ 2026.06" l2="Cambridge, MA" r2="Bachelor of Science" serif={tpl.serif} />
                  <div className="mt-[2px] text-[6.3px] leading-[1.45] text-paper-ink/85">
                    GPA: 4.9/5.0 · 6.031 Software Construction · 6.824 Distributed Systems · 6.813 UI Design · Eta Kappa Nu (HKN)
                  </div>

                  {/* projects */}
                  <PaperHeading icon="folder" text={H.proj} accent={accent} />
                  <Entry l1="Nebula-Flow: High-Performance Low-Code Engine" r1="2024.08 ~ 2025.01" l2="" r2="Lead Maintainer" serif={tpl.serif} />
                  <Bullets
                    items={[
                      'Designed a Proxy-based JavaScript Sandbox to safely execute user-defined logic, ensuring complete isolation from the main thread.',
                      'Implemented a CRDT-based collaborative engine (Yjs) allowing multiple users to edit the flow canvas simultaneously without conflicts.',
                    ]}
                  />
                  <Entry l1="Aether-Quant: WebGL Data Visualizer" r1="2024.01 ~ 2024.04" l2="" r2="Personal Project" serif={tpl.serif} />
                  <Bullets
                    items={[
                      'Built a real-time financial data visualizer using Three.js and WebGL, rendering 100k+ data points at a stable 60FPS.',
                    ]}
                  />

                  {/* skills */}
                  <PaperHeading icon="wrench" text={H.skills} accent={accent} />
                  <div className="mt-[2px] space-y-[1px]">
                    {[
                      ['React 18, Next.js, TypeScript', 'Expert'],
                      ['High-performance Visualization', 'Proficient'],
                      ['LLM orchestration', 'Hands-on experience'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between text-[6.3px]">
                        <span className="font-semibold text-paper-ink/90">{k}</span>
                        <span className="text-paper-muted">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* languages + certs */}
                  <PaperHeading icon="langs" text={H.langs} accent={accent} />
                  <div className="mt-[2px] flex justify-between text-[6.3px] text-paper-ink/85">
                    <span>English — Native/Bilingual</span>
                    <span>Mandarin — Native</span>
                  </div>
                  <PaperHeading icon="award" text={H.certs} accent={accent} />
                  <div className="mt-[2px] text-[6.3px] leading-[1.45] text-paper-ink/85">
                    Winner of MIT Web Lab Competition · AWS Certified Solutions Architect
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* zoom toolbar */}
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-[#141518]/95 px-3.5 py-1.5 text-faint shadow-lg shadow-black/50 ring-1 ring-white/[0.07]">
            <Ic d="zoomOut" s={11} />
            <Ic d="reset" s={11} />
            <Ic d="zoomIn" s={11} />
            <span className="h-3 w-px bg-white/10" />
            <Ic d="download" s={11} />
            <Ic d="fileText" s={11} />
            <Ic d="share" s={11} />
          </div>

          {/* AI proposal chip */}
          {proposal === 'open' && (
            <div className="absolute bottom-13 right-2.5 flex max-w-[86%] items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 shadow-xl shadow-black/60 ring-1 ring-hair">
              <span className="truncate text-[10px] text-muted">
                <span className="text-sky-400">✦ {labels.proposal}:</span> {labels.proposalHint}
              </span>
              <button
                type="button"
                onClick={acceptProposal}
                className="rounded-md bg-add/15 px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-add)] transition-colors hover:bg-add/25"
              >
                {labels.accept}
              </button>
              <button
                type="button"
                onClick={() => setProposal('idle')}
                className="rounded-md px-1.5 py-0.5 text-[10px] text-faint transition-colors hover:text-muted"
              >
                {labels.skip}
              </button>
            </div>
          )}
        </div>

        {/* customize panel */}
        <aside className="hidden min-h-0 flex-col gap-3.5 overflow-hidden border-l border-hair p-4 xl:p-5 md:flex">
          <div className="text-[11.5px] font-semibold text-ink">{labels.customize}</div>

          <PanelHead icon="grid" label={labels.template} />
          <div className="linear-card rounded-lg p-3">
            <div className="flex gap-3">
              <div className="h-[76px] w-[58px] shrink-0 overflow-hidden rounded-[4px] bg-white p-[5px] shadow">
                <div className={`h-[5px] rounded-sm ${tpl.id === 'classic' ? 'mx-auto w-2/3' : 'w-1/2'}`} style={{ background: accent }} />
                <div className={`mt-[3px] h-[2.5px] w-5/6 rounded-sm bg-black/15 ${tpl.id === 'classic' ? 'mx-auto' : ''}`} />
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="mt-[3px] h-[2.5px] w-full rounded-sm bg-black/10" />
                ))}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-ink">{tpl.name}</div>
                <p className="mt-1 line-clamp-3 text-[8.5px] leading-relaxed text-faint">
                  {tpl.desc[lang]}
                </p>
                <button
                  type="button"
                  onClick={() => setTplIdx((tplIdx + 1) % TEMPLATES.length)}
                  className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-medium text-sky-400 transition-colors hover:text-sky-300"
                >
                  {labels.changeTemplate} ›
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {tpl.tags.map((t) => (
              <span key={t} className="linear-field rounded-md px-1.5 py-0.5 text-[8.5px] text-muted">
                {t}
              </span>
            ))}
          </div>

          <PanelHead icon="columns" label={labels.layout} open={false} />
          <PanelHead icon="typeT" label={labels.typography} open={false} />
          <PanelHead icon="palette" label={labels.colors} />

          <div>
            <div className="mb-1.5 text-[8.5px] text-faint">{labels.quickThemes}</div>
            <div className="flex gap-1.5">
              {QUICK.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccent(c)}
                  aria-pressed={accent === c}
                  aria-label={c}
                  className={`flex h-6 w-7 items-center justify-center rounded-md text-white transition-transform hover:scale-105 ${
                    accent === c ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-[var(--color-workbench)]' : 'ring-1 ring-white/10'
                  }`}
                  style={{ background: c }}
                >
                  {accent === c && <span className="text-[9px]">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[8.5px] text-faint">{labels.customColors}</div>
            <div className="mb-1 text-[9px] text-muted">{labels.primary}</div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-[5px] ring-1 ring-white/15" style={{ background: accent }} />
              <span className="linear-field flex-1 rounded-[5px] px-2 py-[4px] font-mono text-[9px] uppercase text-ink/80">
                {accent}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-[5px]">
              {DOTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccent(c)}
                  aria-label={c}
                  className={`h-3 w-3 rounded-full transition-transform hover:scale-125 ${
                    accent === c ? 'ring-2 ring-white/70' : 'ring-1 ring-white/10'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="mb-1 mt-2 text-[9px] text-muted">{labels.secondary}</div>
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-[5px] bg-[#333] ring-1 ring-white/15" />
              <span className="linear-field flex-1 rounded-[5px] px-2 py-[4px] font-mono text-[9px] text-ink/80">
                #333333
              </span>
            </div>
          </div>
        </aside>

        {/* right tool rail */}
        <aside className="hidden min-h-0 flex-col items-center gap-1.5 border-l border-hair py-4 lg:flex">
          {(['grid', 'columns', 'typeT', 'palette'] as const).map((ic, i) => (
            <span
              key={ic}
              className={`flex h-8 w-8 items-center justify-center rounded-md ${
                i === 0 ? 'bg-sky-400/12 text-sky-400 ring-1 ring-sky-400/25' : 'text-faint'
              }`}
            >
              <Ic d={ic} s={13} />
            </span>
          ))}
        </aside>
      </div>
    </div>
  );
}

import { useState } from 'react';

/**
 * FAQ accordion. Height animates via CSS grid-template-rows (the smooth,
 * layout-safe way) — React only toggles which row is open.
 */
export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="group">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left transition-colors hover:bg-white/[0.03]"
            >
              <span className={`text-[15px] font-medium transition-colors ${isOpen ? 'text-ink' : 'text-ink/80'}`}>
                {item.q}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`shrink-0 text-faint transition-transform duration-300 ${isOpen ? 'rotate-45 text-sky-400' : ''}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-350"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl px-4 pb-5 pt-0.5 text-[14px] leading-relaxed text-muted">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

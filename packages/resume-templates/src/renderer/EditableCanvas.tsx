import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Check, X, RotateCcw, Sparkles, Plus, AlertCircle, ChevronDown } from 'lucide-react';
import { WysiwygContent } from '../templateLayout/WysiwygContent';

/**
 * The "living canvas" editable layer.
 *
 * This module turns the otherwise read-only resume render into a locatable,
 * operable surface WITHOUT changing the default (production) render. The layout
 * components wrap their editable fields in <Editable />, which:
 *
 *   - in the default case (no provider / `enabled` false) renders the field
 *     exactly as before — plain WysiwygContent or text;
 *   - when an {@link EditableCanvasProvider} is mounted, it stamps a
 *     `data-resume-path` anchor on the node, reveals a hover handle, and renders
 *     any pending AI change in place (red-delete / green-add + accept/discard).
 *
 * The provider is supplied by the AI Lab's interactive canvas in `apps/web`.
 * Keeping the contract here (path scheme + render) lets later layers — the
 * JD-match map, the proactive coach — reuse the same "locate + propose" surface.
 */

/** A precise, resolvable handle to one editable field on one item. */
export interface EditableTarget {
  /** resume section key, e.g. `experience` (or the sentinel `info` for header fields) */
  sectionKey: string;
  /** stable item id (we anchor by id, not array index, since the render filters hidden items) */
  itemId: string;
  /** the actual field key that holds the value, e.g. `summary` */
  fieldKey: string;
  /** `html` fields go through WysiwygContent; `text` fields render inline */
  kind: 'html' | 'text';
  /** human label for logs / the review bar, e.g. `工作经历 · 第 2 条` */
  label: string;
}

export type PendingStatus = 'pending' | 'accepted';

/** The in-place revision the user reviews: original vs. proposed, plus the "why". */
export interface PendingChangeView {
  before: string;
  after: string;
  /** Optional review-only values for selection-scoped diffs. Accept still uses `after`. */
  previewBefore?: string;
  previewAfter?: string;
  previewKind?: 'html' | 'text';
  rationale: string;
  /** optional longer "why" revealed on demand (design §D — hover 可展开更细) */
  rationaleDetail?: string;
  status?: PendingStatus;
  /** true when this is a brand-new item being proposed (green-only, no red delete) */
  isInsert?: boolean;
}

export interface EditableCanvasContextValue {
  enabled: boolean;
  /** keyed by {@link pathOf} */
  pendingByPath: Record<string, PendingChangeView>;
  /** paths currently being (re)generated — render a shimmer */
  processingPaths: string[];
  /** path → error message, when a generation failed (design §6 错误态) */
  errorsByPath: Record<string, string>;
  /** path whose action popover is open — keep it highlighted */
  activePath: string | null;
  onHandleClick: (target: EditableTarget, anchor: HTMLElement) => void;
  onAccept: (path: string) => void;
  onDiscard: (path: string) => void;
  onRegenerate: (path: string) => void;
  onRetry: (path: string) => void;
  /** a section-title handle was clicked (design §5B 段落标题/排序) */
  onSectionHandleClick: (sectionKey: string, title: string, anchor: HTMLElement) => void;
}

/** Canonical path string — used both as the map key and the DOM `data-resume-path`. */
export function pathOf(t: Pick<EditableTarget, 'sectionKey' | 'itemId' | 'fieldKey'>): string {
  if (t.sectionKey === 'info') return `info.${t.fieldKey}`;
  return `sections.${t.sectionKey}[${t.itemId}].${t.fieldKey}`;
}

const DEFAULT_CONTEXT: EditableCanvasContextValue = {
  enabled: false,
  pendingByPath: {},
  processingPaths: [],
  errorsByPath: {},
  activePath: null,
  onHandleClick: () => {},
  onAccept: () => {},
  onDiscard: () => {},
  onRegenerate: () => {},
  onRetry: () => {},
  onSectionHandleClick: () => {},
};

const EditableCanvasContext = createContext<EditableCanvasContextValue>(DEFAULT_CONTEXT);

export const EditableCanvasProvider = EditableCanvasContext.Provider;
export const useEditableCanvas = () => useContext(EditableCanvasContext);

// Revision palette — lives on the white resume page, independent of the dark workbench.
const DEL_COLOR = '#dc2626';
const INS_COLOR = '#15803d';
const HANDLE_COLOR = '#0284c7';

interface EditableProps {
  target: EditableTarget;
  /** present when target.kind === 'html' */
  html?: string;
  /** present when target.kind === 'text' */
  text?: string;
}

function RawContent({ target, html, text }: EditableProps) {
  if (target.kind === 'html') return <WysiwygContent dirtyHtml={html || ''} />;
  return <>{text}</>;
}

function RevisionContent({ kind, value }: { kind: 'html' | 'text'; value: string }) {
  if (kind === 'html') return <WysiwygContent dirtyHtml={value} />;
  return <>{value}</>;
}

export function Editable(props: EditableProps) {
  const { target } = props;
  const ctx = useEditableCanvas();
  const path = pathOf(target);
  const [hovered, setHovered] = useState(false);
  const handleRef = useRef<HTMLButtonElement>(null);
  // The handle floats 6px outside the field's left edge, so moving text → handle
  // crosses a gap that belongs to neither box and would fire onMouseLeave. Bridge
  // it with intent: open immediately, but defer the close so the handle (which
  // re-opens on its own enter) stays reachable across the gap.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openHover = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setHovered(true);
  };
  const closeHoverSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHovered(false), 160);
  };
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Default render path: identical to the pre-canvas behavior. Zero production impact.
  if (!ctx.enabled) {
    return <RawContent {...props} />;
  }

  const pending = ctx.pendingByPath[path];
  const processing = ctx.processingPaths.includes(path);
  const error = ctx.errorsByPath[path];
  const isActive = ctx.activePath === path;

  if (pending) {
    if (pending.status === 'accepted') {
      // Brief green flash, then the parent applies the change and drops it → render after-text.
      return (
        <div data-resume-path={path} className="lc-flash" style={{ borderRadius: 6 }}>
          <RawContent target={target} html={pending.after} text={pending.after} />
        </div>
      );
    }
    return <PendingChangeCard path={path} kind={target.kind} pending={pending} ctx={ctx} />;
  }

  return (
    <div
      data-resume-path={path}
      onMouseEnter={openHover}
      onMouseLeave={closeHoverSoon}
      style={{
        position: 'relative',
        borderRadius: 6,
        transition: 'background-color 140ms ease, box-shadow 140ms ease',
        backgroundColor: hovered || isActive ? 'rgba(2,132,199,0.06)' : 'transparent',
        boxShadow: isActive ? 'inset 0 0 0 1px rgba(2,132,199,0.35)' : 'none',
      }}
    >
      <RawContent {...props} />

      {processing && (
        <span
          className="lc-shimmer"
          aria-hidden
          style={{ position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none' }}
        />
      )}

      {error && <ErrorChip message={error} onRetry={() => ctx.onRetry(path)} />}

      <button
        ref={handleRef}
        type="button"
        aria-label="让 AI 改这一处"
        title="让 AI 改这一处"
        onMouseEnter={openHover}
        onMouseLeave={closeHoverSoon}
        onClick={(e) => {
          e.stopPropagation();
          if (handleRef.current) ctx.onHandleClick(target, handleRef.current);
        }}
        style={{
          position: 'absolute',
          top: '0.1em',
          left: 0,
          transform: 'translateX(calc(-100% - 6px))',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          color: '#fff',
          background: HANDLE_COLOR,
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          opacity: hovered || isActive ? 1 : 0,
          pointerEvents: hovered || isActive ? 'auto' : 'none',
          transition: 'opacity 140ms ease, transform 140ms ease',
        }}
      >
        <Sparkles size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function ErrorChip({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRetry();
      }}
      className="lc-enter"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
        padding: '2px 8px',
        borderRadius: 6,
        border: '1px solid #fecaca',
        background: '#fef2f2',
        color: DEL_COLOR,
        fontSize: '0.72em',
        cursor: 'pointer',
      }}
    >
      <AlertCircle size={12} strokeWidth={2.4} />
      {message}
    </button>
  );
}

function CtrlButton({
  onClick,
  label,
  color,
  children,
}: {
  onClick: () => void;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 24,
        height: 24,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        color,
        background: hover ? `${color}1f` : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 120ms ease',
      }}
    >
      {children}
    </button>
  );
}

function PendingChangeCard({
  path,
  kind,
  pending,
  ctx,
}: {
  path: string;
  kind: 'html' | 'text';
  pending: PendingChangeView;
  ctx: EditableCanvasContextValue;
}) {
  const [expanded, setExpanded] = useState(false);
  const isInsert = pending.isInsert || pending.before.trim() === '';
  const beforeValue = pending.previewBefore ?? pending.before;
  const afterValue = pending.previewAfter ?? pending.after;
  const revisionKind = pending.previewKind ?? kind;
  return (
    <div
      data-resume-path={path}
      className="lc-enter"
      style={{
        margin: '2px 0',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #ececed',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {!isInsert && (
        <div
          style={{
            background: '#fef2f2',
            color: DEL_COLOR,
            padding: '5px 9px',
            textDecoration: 'line-through',
            textDecorationColor: 'rgba(220,38,38,0.45)',
            overflowWrap: 'anywhere',
          }}
        >
          <RevisionContent kind={revisionKind} value={beforeValue} />
        </div>
      )}
      <div className="lc-grow">
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div
            style={{
              background: '#f0fdf4',
              color: INS_COLOR,
              padding: '5px 9px',
              display: 'flex',
              gap: 6,
              alignItems: 'flex-start',
              overflowWrap: 'anywhere',
            }}
          >
            {isInsert && (
              <span
                style={{
                  flexShrink: 0,
                  fontSize: '0.66em',
                  fontWeight: 600,
                  lineHeight: 1.6,
                  padding: '0 5px',
                  borderRadius: 4,
                  background: 'rgba(21,128,61,0.12)',
                }}
              >
                新增
              </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <RevisionContent kind={revisionKind} value={afterValue} />
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 6px 4px 9px',
          background: '#fafafa',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <button
          type="button"
          onClick={() => pending.rationaleDetail && setExpanded((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 3,
            fontSize: '0.72em',
            color: '#6b7280',
            lineHeight: 1.3,
            textAlign: 'left',
            cursor: pending.rationaleDetail ? 'pointer' : 'default',
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            理由：{expanded && pending.rationaleDetail ? pending.rationaleDetail : pending.rationale}
          </span>
          {pending.rationaleDetail && (
            <ChevronDown
              size={11}
              style={{
                flexShrink: 0,
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 140ms ease',
                alignSelf: 'center',
              }}
            />
          )}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, flexShrink: 0 }}>
          <CtrlButton onClick={() => ctx.onAccept(path)} label="接受" color={INS_COLOR}>
            <Check size={15} strokeWidth={2.4} />
          </CtrlButton>
          <CtrlButton onClick={() => ctx.onRegenerate(path)} label="再来一版" color="#6b7280">
            <RotateCcw size={14} strokeWidth={2.2} />
          </CtrlButton>
          <CtrlButton onClick={() => ctx.onDiscard(path)} label="放弃" color={DEL_COLOR}>
            <X size={15} strokeWidth={2.4} />
          </CtrlButton>
        </div>
      </div>
    </div>
  );
}

/** A hover handle next to a section title (add an item / reorder — design §5B). */
export function SectionHandle({ sectionKey, title }: { sectionKey: string; title: string }) {
  const ctx = useEditableCanvas();
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  if (!ctx.enabled) return null;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`对「${title}」这段操作`}
      title="补充 / 调整这段"
      className="lc-section-handle"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (ref.current) ctx.onSectionHandleClick(sectionKey, title, ref.current);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '0.9em',
        height: '0.9em',
        marginLeft: '0.1em',
        borderRadius: 4,
        color: HANDLE_COLOR,
        background: hover ? 'rgba(2,132,199,0.14)' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 140ms ease',
        verticalAlign: 'middle',
      }}
    >
      <Plus size={11} strokeWidth={2.6} />
    </button>
  );
}

/** Renders pending "add a new item" proposals at the end of a section. */
export function SectionInsertSlot({ sectionKey }: { sectionKey: string }) {
  const ctx = useEditableCanvas();
  if (!ctx.enabled) return null;
  const prefix = `sections.${sectionKey}[new-`;
  const inserts = Object.entries(ctx.pendingByPath).filter(
    ([p, c]) => p.startsWith(prefix) && c.status !== 'accepted'
  );
  const processing = ctx.processingPaths.filter((p) => p.startsWith(prefix));
  if (inserts.length === 0 && processing.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
      {processing.map((p) => (
        <div
          key={p}
          data-resume-path={p}
          style={{
            position: 'relative',
            minHeight: 22,
            borderRadius: 6,
            border: '1px dashed #bbf7d0',
            padding: '4px 9px',
            color: INS_COLOR,
            fontSize: '0.72em',
          }}
        >
          正在补充这一条…
          <span
            className="lc-shimmer"
            aria-hidden
            style={{ position: 'absolute', inset: 0, borderRadius: 6, pointerEvents: 'none' }}
          />
        </div>
      ))}
      {inserts.map(([p, pending]) => (
        <PendingChangeCard key={p} path={p} kind="html" pending={pending} ctx={ctx} />
      ))}
    </div>
  );
}

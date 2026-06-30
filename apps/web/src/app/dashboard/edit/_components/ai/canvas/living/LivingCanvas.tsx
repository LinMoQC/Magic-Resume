'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ListChecks } from 'lucide-react';
import { InfoType, Resume, Section } from '@/types/frontend/resume';
import {
  EditableCanvasProvider,
  pathOf,
  type EditableTarget,
  type EditableCanvasContextValue,
  type PendingChangeView,
} from '../../lib/editableCanvas';
import ResumePreview from '../../../preview/ResumePreview';
import ActionPopover from './ActionPopover';
import ReviewBar from './ReviewBar';
import SelectionActionBar from './SelectionActionBar';
import SectionActionPopover from './SectionActionPopover';
import ChangesPanel from './ChangesPanel';
import {
  applyChangeToSections,
  applyInfoChange,
  parsePath,
  reorderSection,
  sectionTitle,
  type PendingChange,
  type QuickActionId,
  type SelectionActionId,
} from '../../lib/changeModel';
import {
  createInsertChange,
  createPendingChange,
  createSelectionChange,
  regeneratePendingChange,
} from '../../lib/mock/changeMock';
import { diffResumeToChanges, type BatchKind } from '../../lib/diffResume';

const PAGE_WIDTH = 794;
const SCALE = 0.82;

export type BatchRequest = {
  kind: BatchKind;
  lang?: string;
  nonce: number;
  /** The agent's proposed resume (from a `resume_update` event) to diff against current. */
  proposedSections?: Section;
};
export type FocusRequest = { path: string; nonce: number };

type LivingCanvasProps = {
  resumeData: Resume;
  templateId: string;
  onApplySections: (sections: Section) => void;
  onApplyInfo: (info: InfoType) => void;
  onLog: (text: string, resumePath?: string) => void;
  batchRequest?: BatchRequest | null;
  focusRequest?: FocusRequest | null;
};

type SelectionState = { target: EditableTarget; rect: DOMRect; text: string };
type SectionPopoverState = { sectionKey: string; title: string; rect: DOMRect };

export default function LivingCanvas({
  resumeData,
  templateId,
  onApplySections,
  onApplyInfo,
  onLog,
  batchRequest,
  focusRequest,
}: LivingCanvasProps) {
  const [pending, setPending] = useState<Record<string, PendingChange>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [popover, setPopover] = useState<{ target: EditableTarget; rect: DOMRect } | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [sectionPopover, setSectionPopover] = useState<SectionPopoverState | null>(null);
  const [cursor, setCursor] = useState(0);
  // `interacted` tracked first user action to gate the (now-removed) hover hint;
  // the value is no longer read, but the setter is kept harmless at call sites.
  const [, setInteracted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Refs keep async callbacks (timeouts) reading the latest values, not stale closures.
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const sectionsRef = useRef(resumeData.sections);
  sectionsRef.current = resumeData.sections;
  const infoRef = useRef(resumeData.info);
  infoRef.current = resumeData.info;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const errorAttemptsRef = useRef<Record<string, PendingChange>>({});

  const activePath = popover ? pathOf(popover.target) : null;

  const fieldHtml = useCallback((target: EditableTarget): string => {
    if (target.sectionKey === 'info') {
      return String((infoRef.current as Record<string, unknown>)[target.fieldKey] ?? '');
    }
    const items = sectionsRef.current[target.sectionKey];
    if (!Array.isArray(items)) return '';
    const item = items.find((it) => String(it.id) === target.itemId);
    return item ? String(item[target.fieldKey] ?? '') : '';
  }, []);

  const dropFromOrder = useCallback((path: string) => {
    setOrder((prev) => prev.filter((p) => p !== path));
  }, []);

  // The popover / bars are fixed-positioned; drop them when the canvas scrolls.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setPopover(null);
      setSelection(null);
      setSectionPopover(null);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Dismiss a pending selection when clicking outside the resume / the selection bar.
  useEffect(() => {
    if (!selection) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-selection-bar]') || t.closest('[data-resume-path]')) return;
      setSelection(null);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [selection]);

  const scrollToPath = useCallback((path: string) => {
    const el = scrollRef.current?.querySelector(`[data-resume-path="${path}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('lc-highlight');
    // restart the animation
    void (el as HTMLElement).offsetWidth;
    el.classList.add('lc-highlight');
    window.setTimeout(() => el.classList.remove('lc-highlight'), 1200);
  }, []);

  // Commit a freshly generated change — or, on a simulated failure, surface a retry.
  const commit = useCallback((change: PendingChange) => {
    const path = pathOf(change.target);
    const failed = !change.isInsert && change.seed === 0 && Math.random() < 0.15;
    if (failed) {
      errorAttemptsRef.current[path] = change;
      setErrors((prev) => ({ ...prev, [path]: '这处没改成，点一下重试' }));
      return;
    }
    delete errorAttemptsRef.current[path];
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
    setPending((prev) => ({ ...prev, [path]: change }));
    setOrder((prev) => (prev.includes(path) ? prev : [...prev, path]));
  }, []);

  const handleHandleClick = useCallback((target: EditableTarget, anchor: HTMLElement) => {
    setInteracted(true);
    setSelection(null);
    setSectionPopover(null);
    setPopover({ target, rect: anchor.getBoundingClientRect() });
  }, []);

  const runAction = useCallback(
    (action: QuickActionId | 'free', freeText?: string) => {
      if (!popover) return;
      const { target } = popover;
      const path = pathOf(target);
      const original = fieldHtml(target);
      setPopover(null);
      setInteracted(true);
      setProcessing((prev) => (prev.includes(path) ? prev : [...prev, path]));
      window.setTimeout(() => {
        setProcessing((prev) => prev.filter((p) => p !== path));
        commit(createPendingChange(target, original, action, freeText));
      }, 900);
    },
    [popover, fieldHtml, commit]
  );

  // P2 · selection-driven. Detect a text selection inside an editable field.
  const onResumeMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const startEl = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
    const anchorEl = startEl?.closest('[data-resume-path]') as HTMLElement | null;
    const path = anchorEl?.getAttribute('data-resume-path');
    if (!path || pendingRef.current[path]) {
      setSelection(null);
      return;
    }
    const parsed = parsePath(path);
    if (!parsed) {
      setSelection(null);
      return;
    }
    const target: EditableTarget = {
      ...parsed,
      kind: parsed.sectionKey === 'info' ? 'text' : 'html',
      label: `选中片段 · ${sectionTitle(parsed.sectionKey)}`,
    };
    setPopover(null);
    setSectionPopover(null);
    setInteracted(true);
    setSelection({ target, rect: range.getBoundingClientRect(), text: sel.toString() });
  }, []);

  const runSelectionAction = useCallback(
    (action: SelectionActionId | 'free', freeText?: string) => {
      const sel = selectionRef.current;
      if (!sel) return;
      const { target, text } = sel;
      const path = pathOf(target);
      const fullHtml = fieldHtml(target);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      setProcessing((prev) => (prev.includes(path) ? prev : [...prev, path]));
      window.setTimeout(() => {
        setProcessing((prev) => prev.filter((p) => p !== path));
        commit(createSelectionChange(target, fullHtml, text, action, freeText));
      }, 900);
    },
    [fieldHtml, commit]
  );

  // §5B · section-title handle → add an item / reorder.
  const onSectionHandleClick = useCallback((sectionKey: string, title: string, anchor: HTMLElement) => {
    setInteracted(true);
    setPopover(null);
    setSelection(null);
    setSectionPopover({ sectionKey, title, rect: anchor.getBoundingClientRect() });
  }, []);

  const addItem = useCallback(
    (sectionKey: string, title: string) => {
      setSectionPopover(null);
      const change = createInsertChange(sectionKey, title);
      const path = pathOf(change.target);
      setProcessing((prev) => [...prev, path]);
      window.setTimeout(() => {
        setProcessing((prev) => prev.filter((p) => p !== path));
        commit(change);
      }, 900);
    },
    [commit]
  );

  const reorder = useCallback(
    (sectionKey: string, title: string) => {
      setSectionPopover(null);
      const next = reorderSection(sectionsRef.current, sectionKey);
      if (next === sectionsRef.current) return;
      onApplySections(next);
      onLog(`已调整顺序 · ${title}`);
    },
    [onApplySections, onLog]
  );

  const accept = useCallback(
    (path: string) => {
      const change = pendingRef.current[path];
      if (!change) return;
      if (change.target.sectionKey === 'info') {
        onApplyInfo(applyInfoChange(infoRef.current, change));
      } else {
        onApplySections(applyChangeToSections(sectionsRef.current, change));
      }
      onLog(
        change.isInsert
          ? `已新增 · ${sectionTitle(change.target.sectionKey)}`
          : `已改写 · ${change.target.label}`,
        path
      );
      setPending((prev) => ({ ...prev, [path]: { ...change, status: 'accepted' } }));
      dropFromOrder(path);
      window.setTimeout(() => {
        setPending((prev) => {
          const next = { ...prev };
          delete next[path];
          return next;
        });
      }, 420);
    },
    [onApplySections, onApplyInfo, onLog, dropFromOrder]
  );

  const discard = useCallback(
    (path: string) => {
      setPending((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
      dropFromOrder(path);
    },
    [dropFromOrder]
  );

  const regenerate = useCallback((path: string) => {
    const change = pendingRef.current[path];
    if (!change) return;
    setPending((prev) => ({ ...prev, [path]: regeneratePendingChange(change) }));
  }, []);

  const retry = useCallback(
    (path: string) => {
      const attempt = errorAttemptsRef.current[path];
      setErrors((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
      if (!attempt) return;
      setProcessing((prev) => (prev.includes(path) ? prev : [...prev, path]));
      window.setTimeout(() => {
        setProcessing((prev) => prev.filter((p) => p !== path));
        commit(regeneratePendingChange(attempt)); // seed bumped → recovers
      }, 700);
    },
    [commit]
  );

  const acceptAll = useCallback(() => {
    const changes = order.map((p) => pendingRef.current[p]).filter(Boolean) as PendingChange[];
    if (!changes.length) return;
    let nextSections = sectionsRef.current;
    let nextInfo = infoRef.current;
    let infoTouched = false;
    for (const c of changes) {
      if (c.target.sectionKey === 'info') {
        nextInfo = applyInfoChange(nextInfo, c);
        infoTouched = true;
      } else {
        nextSections = applyChangeToSections(nextSections, c);
      }
    }
    onApplySections(nextSections);
    if (infoTouched) onApplyInfo(nextInfo);
    onLog(`已接受 ${changes.length} 处改动`);
    setPending({});
    setOrder([]);
    setCursor(0);
    setPanelOpen(false);
  }, [order, onApplySections, onApplyInfo, onLog]);

  const discardAll = useCallback(() => {
    setPending({});
    setOrder([]);
    setCursor(0);
    setPanelOpen(false);
  }, []);

  const goTo = useCallback(
    (dir: 1 | -1) => {
      if (order.length === 0) return;
      const nextCursor = (cursor + dir + order.length) % order.length;
      setCursor(nextCursor);
      scrollToPath(order[nextCursor]);
    },
    [cursor, order, scrollToPath]
  );

  // Keyboard review shortcuts — only while reviewing and no overlay is open.
  useEffect(() => {
    if (order.length === 0 || popover || selection || sectionPopover) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        acceptAll();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        goTo(1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const path = order[Math.min(cursor, order.length - 1)];
        if (path) accept(path);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const path = order[Math.min(cursor, order.length - 1)];
        if (path) discard(path);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, cursor, popover, selection, sectionPopover, acceptAll, goTo, accept, discard]);

  // P3 · a whole-resume skill seeds a batch of in-place changes (replaces the old Diff tab).
  const lastBatchNonce = useRef<number>(0);
  useEffect(() => {
    if (!batchRequest || batchRequest.nonce === lastBatchNonce.current) return;
    lastBatchNonce.current = batchRequest.nonce;
    if (!batchRequest.proposedSections) return;
    const changes = diffResumeToChanges(
      sectionsRef.current,
      batchRequest.proposedSections,
      batchRequest.kind,
      batchRequest.lang
    );
    if (!changes.length) return;
    const entries = changes.map((c) => ({ path: pathOf(c.target), change: c }));
    const paths = entries.map((e) => e.path);
    setInteracted(true);
    setProcessing((prev) => [...prev, ...paths.filter((p) => !prev.includes(p))]);
    window.setTimeout(() => {
      setProcessing((prev) => prev.filter((p) => !paths.includes(p)));
      setPending((prev) => {
        const next = { ...prev };
        for (const { path, change } of entries) next[path] = change;
        return next;
      });
      setOrder((prev) => [...prev, ...paths.filter((p) => !prev.includes(p))]);
      setCursor(0);
    }, 1000);
  }, [batchRequest]);

  // Click a conversation log entry → jump to that spot on the canvas. The resume
  // template renders async on (re)mount, so poll briefly until the node exists.
  const lastFocusNonce = useRef<number>(0);
  useEffect(() => {
    if (!focusRequest || focusRequest.nonce === lastFocusNonce.current) return;
    lastFocusNonce.current = focusRequest.nonce;
    const { path } = focusRequest;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const el = scrollRef.current?.querySelector(`[data-resume-path="${path}"]`);
      if (el) {
        scrollToPath(path);
      } else if (tries++ < 14) {
        timer = setTimeout(attempt, 120);
      }
    };
    timer = setTimeout(attempt, 60);
    return () => clearTimeout(timer);
  }, [focusRequest, scrollToPath]);

  // §10 · if the source diverges from a pending change's `before`, the user hand-edited
  // it elsewhere → treat that as discarding the proposal.
  useEffect(() => {
    const current = pendingRef.current;
    const stale = Object.entries(current).filter(([, c]) => {
      if (c.status === 'accepted' || c.isInsert) return false;
      return fieldHtml(c.target) !== c.before;
    });
    if (stale.length === 0) return;
    const stalePaths = new Set(stale.map(([p]) => p));
    setPending((prev) => {
      const next = { ...prev };
      for (const p of stalePaths) delete next[p];
      return next;
    });
    setOrder((prev) => prev.filter((p) => !stalePaths.has(p)));
  }, [resumeData.sections, resumeData.info, fieldHtml]);

  const pendingByPath = useMemo<Record<string, PendingChangeView>>(() => {
    const out: Record<string, PendingChangeView> = {};
    for (const [path, c] of Object.entries(pending)) {
      out[path] = {
        before: c.before,
        after: c.after,
        rationale: c.rationale,
        rationaleDetail: c.rationaleDetail,
        status: c.status,
        isInsert: c.isInsert,
      };
    }
    return out;
  }, [pending]);

  const ctxValue = useMemo<EditableCanvasContextValue>(
    () => ({
      enabled: true,
      pendingByPath,
      processingPaths: processing,
      errorsByPath: errors,
      activePath,
      onHandleClick: handleHandleClick,
      onAccept: accept,
      onDiscard: discard,
      onRegenerate: regenerate,
      onRetry: retry,
      onSectionHandleClick,
    }),
    [pendingByPath, processing, errors, activePath, handleHandleClick, accept, discard, regenerate, retry, onSectionHandleClick]
  );

  const count = order.length;

  const changeRows = useMemo(
    () =>
      order
        .map((path) => {
          const c = pending[path];
          if (!c) return null;
          return { path, label: c.target.label, rationale: c.rationale, isInsert: c.isInsert };
        })
        .filter(Boolean) as { path: string; label: string; rationale: string; isInsert?: boolean }[],
    [order, pending]
  );

  const jumpTo = useCallback(
    (path: string) => {
      setPanelOpen(false);
      const idx = order.indexOf(path);
      if (idx >= 0) setCursor(idx);
      scrollToPath(path);
    },
    [order, scrollToPath]
  );

  return (
    <div className="relative flex flex-col h-full min-w-0 bg-neutral-900/25">
      {count > 0 && (
        <div className="flex items-center px-5 py-3 shrink-0">
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
          >
            <ListChecks size={12} />
            {count} 处改动
          </button>
        </div>
      )}

      <AnimatePresence>
        {panelOpen && (
          <ChangesPanel
            rows={changeRows}
            onJump={jumpTo}
            onAcceptAll={acceptAll}
            onDiscardAll={discardAll}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        onMouseUp={onResumeMouseUp}
        className="relative flex-1 overflow-auto custom-scrollbar"
      >
        <div className="flex justify-center pt-6 pb-24 px-12">
          <div style={{ width: PAGE_WIDTH * SCALE }}>
            <div
              className="bg-white rounded-lg shadow-2xl"
              style={{
                width: PAGE_WIDTH,
                transform: `scale(${SCALE})`,
                transformOrigin: 'top left',
                overflow: 'visible',
              }}
            >
              <EditableCanvasProvider value={ctxValue}>
                <div style={{ padding: 4 }}>
                  <ResumePreview
                    info={resumeData.info}
                    sections={resumeData.sections}
                    sectionOrder={resumeData.sectionOrder.map((s) => s.key)}
                    templateId={templateId}
                  />
                </div>
              </EditableCanvasProvider>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {count > 0 && (
          <ReviewBar
            count={count}
            onPrev={() => goTo(-1)}
            onNext={() => goTo(1)}
            onAcceptAll={acceptAll}
            onDiscardAll={discardAll}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {popover && (
          <ActionPopover
            key={pathOf(popover.target)}
            target={popover.target}
            anchorRect={popover.rect}
            onRun={runAction}
            onClose={() => setPopover(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selection && (
          <SelectionActionBar
            rect={selection.rect}
            onRun={runSelectionAction}
            onClose={() => setSelection(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sectionPopover && (
          <SectionActionPopover
            title={sectionPopover.title}
            anchorRect={sectionPopover.rect}
            onAdd={() => addItem(sectionPopover.sectionKey, sectionPopover.title)}
            onReorder={() => reorder(sectionPopover.sectionKey, sectionPopover.title)}
            onClose={() => setSectionPopover(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

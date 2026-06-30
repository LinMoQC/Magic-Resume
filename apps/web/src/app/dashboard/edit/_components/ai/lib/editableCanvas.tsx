'use client';

import { createContext, useContext } from 'react';

export interface EditableTarget {
  sectionKey: string;
  itemId: string;
  fieldKey: string;
  kind: 'html' | 'text';
  label: string;
}

export type PendingStatus = 'pending' | 'accepted';

export interface PendingChangeView {
  before: string;
  after: string;
  rationale: string;
  rationaleDetail?: string;
  status?: PendingStatus;
  isInsert?: boolean;
}

export interface EditableCanvasContextValue {
  enabled: boolean;
  pendingByPath: Record<string, PendingChangeView>;
  processingPaths: string[];
  errorsByPath: Record<string, string>;
  activePath: string | null;
  onHandleClick: (target: EditableTarget, anchor: HTMLElement) => void;
  onAccept: (path: string) => void;
  onDiscard: (path: string) => void;
  onRegenerate: (path: string) => void;
  onRetry: (path: string) => void;
  onSectionHandleClick: (sectionKey: string, title: string, anchor: HTMLElement) => void;
}

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

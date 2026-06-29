'use client';

import React from 'react';
import { WIDGETS } from '../widgets/registry';
import type { WidgetActionResult, WidgetInstance } from '../widgets/types';

/**
 * Dispatches a `widget` chat message to its registered component. Unknown kind or
 * props that fail the descriptor's `normalize` degrade to a plain text line — a
 * stray widget never breaks the thread (design/genui-systematization.md §4).
 */
export default function WidgetHost({
  instance,
  onAction,
}: {
  instance: WidgetInstance;
  onAction: (widgetId: string, result: WidgetActionResult) => void;
}) {
  const descriptor = WIDGETS[instance.kind];
  const normalized = descriptor?.normalize
    ? descriptor.normalize(instance.props)
    : instance.props;

  if (!descriptor || !normalized) {
    return (
      <div className="flex items-center gap-2 pl-10 text-[11px] text-neutral-500">
        <span className="truncate">（无法渲染的卡片：{instance.kind}）</span>
      </div>
    );
  }

  const Component = descriptor.component;
  return (
    <Component
      instance={{ ...instance, props: normalized }}
      onAction={(result) => onAction(instance.widgetId, result)}
    />
  );
}

'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 阶段 4 · C4 —— 拦截式模态路由的平滑退场。
 *
 * `@modal` 平行槽里的 `(.)ai-lab / history / share / json / feedback` 默认写死
 * `isOpen={true}`,关闭时直接 `router.back()`。而 back() 会立刻卸载模态,模态自身
 * 的 framer `AnimatePresence` 退场(或 Radix close 动画)根本来不及播 → 关闭很硬。
 *
 * 本 hook 把 open 收到本地:`close()` 先把 open 置 false 让模态播放退场动画,再在
 * `exitMs` 后 `router.back()` 弹出路由,从而得到平滑的「编辑器 ↔ 模态路由」过渡。
 * `exitMs` 约等于各模态退场时长(framer 默认 opacity ~0.2–0.3s),可按观感微调。
 * 幂等:重复 close() 只弹一次,避免连点越过编辑器。
 */
export function useInterceptModalRoute(exitMs = 280) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    window.setTimeout(() => router.back(), exitMs);
  }, [router, exitMs]);

  return { open, close };
}

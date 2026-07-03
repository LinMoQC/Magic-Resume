"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** Sizing utilities for the card (e.g. `w-[min(920px,92vw)] h-[min(660px,86vh)]`). */
  className?: string;
  /** Extra controls rendered left of the close button in the header. */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Dark "workbench" modal shell shared by the settings + account modals. Radix
 * Dialog handles focus-trap / Esc / a11y; framer drives the enter/exit. The sky
 * top-seam is the instrument-signature detail (see design spec). Body is a flex
 * column that fills remaining height — callers own the inner layout.
 */
export function ModalShell({ open, onOpenChange, title, className, headerRight, children }: ModalShellProps) {
  const reduce = useReducedMotion();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) onOpenChange(false);
                }}
              >
                <motion.div
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A0A0A] shadow-2xl shadow-black/60",
                    className,
                  )}
                >
                  {/* sky top-seam — reuses the via-sky rule motif from the settings page */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

                  <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
                    <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-neutral-100">
                      {title}
                    </DialogPrimitive.Title>
                    <div className="flex items-center gap-2">
                      {headerRight}
                      <DialogPrimitive.Close
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-white/[0.06] hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                      >
                        <X size={18} />
                      </DialogPrimitive.Close>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

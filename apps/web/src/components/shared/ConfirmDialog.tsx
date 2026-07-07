"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'danger'
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      {/* Custom overlay carries a higher z-index so the dialog floats above the AI Lab. */}
      <div className={`fixed inset-0 z-150 ${isOpen ? 'block' : 'hidden'}`}>
        {/* Slightly deeper scrim + soft blur to focus the dialog over the dark workbench. */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer"
          onClick={onClose}
        />
        <AlertDialogContent className="fixed top-1/2 left-1/2 z-150 grid w-full max-w-[calc(100%-2rem)] sm:max-w-md -translate-x-1/2 -translate-y-1/2 gap-3.5 rounded-2xl border border-white/[0.06] bg-neutral-950 p-6 text-white shadow-2xl shadow-black/60">
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle className="text-lg font-semibold tracking-tight text-neutral-50">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="text-[13px] leading-relaxed text-neutral-400">
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 gap-2">
            <AlertDialogCancel
              onClick={onClose}
              className="rounded-lg border border-white/[0.08] bg-transparent px-4 text-neutral-300 hover:bg-white/[0.04] hover:text-neutral-100 focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-0"
            >
              {cancelText || t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={
                variant === 'danger'
                  ? // Restrained destructive: theme red #dc2626, softened a touch so it signals without shouting.
                    'rounded-lg border-none bg-red-600/90 px-4 font-medium text-[#fff] hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-0'
                  : // Positive confirm uses the brand sky accent, matching the composer send button.
                    'rounded-lg border-none bg-sky-500 px-4 font-medium text-[#fff] hover:bg-sky-600 focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-0'
              }
            >
              {confirmText || t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}

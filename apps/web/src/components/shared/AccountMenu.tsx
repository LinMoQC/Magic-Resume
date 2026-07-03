"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  LogOut,
  Settings,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppAuth, useAppUser } from "@/lib/auth";
import { isCloudMode } from "@/lib/config/app";
import { useAccountUiStore } from "@/store/useAccountUiStore";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils/userDisplay";

interface AccountMenuProps {
  /** `up` → opens above (sidebar footer); `right` → opens to the right (editor rail). */
  placement?: "up" | "right";
  /** Optional content (e.g. name / email) rendered inside the trigger, right of the
   *  avatar — makes the whole block the hit target. Omit for an avatar-only trigger. */
  label?: React.ReactNode;
}

const PANEL_WIDTH = 280;
const GAP = 8;

/**
 * GPT-style avatar dropdown replacing Clerk's UserButton. Click-to-open, rich
 * header + featured upgrade card, driving the global settings / account modals
 * via useAccountUiStore. The panel is portaled to <body> with fixed positioning
 * so `overflow-hidden` ancestors (the 256px sidebar, the 52px editor rail) can't
 * clip it. Cloud-aware: self-hosted shows only personalize / settings / language.
 */
export default function AccountMenu({ placement = "up", label }: AccountMenuProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAppUser();
  const { signOut } = useAppAuth();
  const { openSettings, openAccount } = useAccountUiStore();
  const reduce = useReducedMotion();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left =
      placement === "right"
        ? r.right + GAP
        : Math.max(8, Math.min(r.left, window.innerWidth - PANEL_WIDTH - 8));
    const bottom = placement === "right" ? window.innerHeight - r.bottom : window.innerHeight - r.top + GAP;
    setCoords({ left, bottom });
  }, [placement]);

  useEffect(() => {
    setMounted(true);
    const onClick = (e: MouseEvent) => {
      const node = e.target as Node;
      if (triggerRef.current?.contains(node) || panelRef.current?.contains(node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!mounted || !user?.imageUrl) return;
    const avatarUrl = user.imageUrl;
    const warmAvatar = () => {
      const img = new Image();
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.src = avatarUrl;
      void img.decode?.().catch(() => {
        /* best-effort decode warmup */
      });
    };
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (window.requestIdleCallback) idleId = window.requestIdleCallback(warmAvatar);
    else timeoutId = window.setTimeout(warmAvatar, 120);
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [mounted, user?.imageUrl]);

  if (!mounted) return null;

  const name = user?.fullName ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const initials = getInitials(name, email);
  const currentLang = i18n.language.startsWith("en") ? "en" : "zh";

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  const panel = (
    <motion.div
      ref={panelRef}
      role="menu"
      aria-hidden={!open}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 6, visibility: "hidden" }}
      animate={
        open
          ? { opacity: 1, scale: 1, y: 0, visibility: "visible" }
          : {
              opacity: 0,
              scale: reduce ? 1 : 0.96,
              y: reduce ? 0 : 6,
              transitionEnd: { visibility: "hidden" },
            }
      }
      transition={reduce ? { duration: 0.01 } : { duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        left: coords.left,
        bottom: coords.bottom,
        width: PANEL_WIDTH,
        zIndex: 9999,
        transformOrigin: "bottom left",
        pointerEvents: open ? "auto" : "none",
      }}
      className="rounded-2xl border border-white/[0.06] bg-[#0d0e10]/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl will-change-transform"
    >
      {/* sky top-seam signature */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />

      {isCloudMode && (name || email) && (
        <>
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={name ?? ""} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-neutral-800 text-[11px] font-semibold text-neutral-300">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {name && <p className="truncate text-sm font-semibold text-neutral-100">{name}</p>}
              {email && <p className="truncate text-[11px] text-neutral-500">{email}</p>}
            </div>
          </div>
          <Divider />
        </>
      )}

      {isCloudMode && (
        <button
          type="button"
          role="menuitem"
          onClick={() => run(() => toast(t("account.menu.upgradeSoon")))}
          className="mb-1 flex w-full items-center gap-2.5 rounded-xl border border-sky-400/20 bg-sky-400/[0.06] px-3 py-2.5 text-left transition-colors hover:border-sky-400/30 hover:bg-sky-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
        >
          <Sparkles size={16} className="shrink-0 text-sky-300" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-sky-100">{t("account.menu.upgrade")}</p>
            <p className="truncate text-[11px] text-sky-300/50">{t("account.menu.upgradeHint")}</p>
          </div>
          <ChevronRight size={16} className="shrink-0 text-sky-300/70" />
        </button>
      )}

      {isCloudMode && <MenuRow icon={<UserIcon size={16} />} label={t("account.menu.profile")} onClick={() => run(openAccount)} />}
      <MenuRow icon={<Settings size={16} />} label={t("account.menu.settings")} onClick={() => run(() => openSettings())} />

      {/* in-place language switch */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-2">
        <span className="text-sm text-neutral-400">{t("account.menu.language")}</span>
        <div className="inline-flex rounded-lg bg-white/[0.04] p-0.5">
          {(["en", "zh"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => i18n.changeLanguage(code)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[12px] transition-colors",
                currentLang === code ? "bg-sky-400/15 text-sky-200" : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              {code === "en" ? "EN" : "中文"}
            </button>
          ))}
        </div>
      </div>

      {isCloudMode && (
        <>
          <Divider />
          <button
            type="button"
            role="menuitem"
            onClick={() => run(() => void signOut())}
            className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          >
            <LogOut size={16} className="shrink-0 text-neutral-500 transition-colors group-hover:text-red-400" />
            {t("account.menu.signOut")}
          </button>
        </>
      )}
    </motion.div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          reposition();
          setOpen((v) => !v);
        }}
        onPointerEnter={reposition}
        onFocus={reposition}
        aria-label={t("account.menu.title")}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "group/acct flex items-center outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
          label
            ? "w-full rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
            : "rounded-full",
        )}
      >
        <span className={cn("shrink-0", label && "grid w-9 place-items-center")}>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-1 transition-all",
              open ? "ring-sky-400/40" : "ring-white/10 group-hover/acct:ring-white/20",
            )}
          >
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt={name ?? t("account.menu.title")} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : isCloudMode && initials ? (
              <span className="flex h-full w-full items-center justify-center bg-neutral-800 text-[11px] font-semibold text-neutral-300">
                {initials}
              </span>
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-neutral-800 text-neutral-400">
                <UserIcon size={16} />
              </span>
            )}
          </span>
        </span>
        {label}
      </button>
      {createPortal(panel, document.body)}
    </>
  );
}

function MenuRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
    >
      <span className="shrink-0 text-neutral-500 transition-colors group-hover:text-neutral-300">{icon}</span>
      {label}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 my-1 h-px bg-white/[0.06]" />;
}

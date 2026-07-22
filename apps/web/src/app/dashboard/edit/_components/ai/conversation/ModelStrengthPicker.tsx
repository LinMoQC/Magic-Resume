"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useSettingStore, type Strength } from "@/store/useSettingStore";
import { useEntitlement } from "@/lib/billing/useEntitlement";

const STRENGTHS: Strength[] = ["low", "medium", "high"];

/**
 * Codex-style control embedded in the composer's bottom toolbar: a compact pill
 * ("<model> · <strength>") that opens an upward popover. The menu lets the user
 * explicitly pick the source — Auto (defer to entitlement), a specific internal
 * model (plan allowlist, only when entitled), or their own custom model (BYOK) —
 * plus a 3-stop reasoning slider. The pick persists to useSettingStore
 * (`preferredSource` + `selectedModel`) and drives `source` in `resolveAiAccessConfig`.
 */
export default function ModelStrengthPicker({
  disabled,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const selectedModel = useSettingStore((s) => s.selectedModel);
  const setSelectedModel = useSettingStore((s) => s.setSelectedModel);
  const strength = useSettingStore((s) => s.strength);
  const setStrength = useSettingStore((s) => s.setStrength);
  const byokModel = useSettingStore((s) => s.model);
  const hasByok = useSettingStore((s) => s.hasLlmConfig());
  const preferredSource = useSettingStore((s) => s.preferredSource);
  const setPreferredSource = useSettingStore((s) => s.setPreferredSource);

  const [open, setOpen] = useState(false);
  // Two-level menu: 'main' shows just the selected model + strength; 'models' is
  // the full picker list, opened by tapping the model row.
  const [view, setView] = useState<"main" | "models">("main");
  const rootRef = useRef<HTMLDivElement>(null);

  // Only fetch entitlement once the picker is opened (keeps the last result after
  // close so the pill label stays populated) — no fetch on every composer mount.
  const { data, loading, refresh } = useEntitlement(open);
  // The supported-model catalog (already narrowed by the plan's allowlist on the
  // server). Empty plan allowlist → the full catalog, so the menu still lists our
  // models instead of collapsing to just "Auto".
  const internalModels = data?.availableModels ?? [];
  const canInternal = data?.canUseInternal ?? false;

  // The user explicitly picks the source here; the choice drives `source` in
  // resolveAiAccessConfig. "自动" defers to entitlement (internal → byok).
  const pickAuto = () => {
    setPreferredSource("auto");
    setSelectedModel("");
    setView("main");
  };
  const pickInternal = (m: string) => {
    setPreferredSource("internal");
    setSelectedModel(m);
    setView("main");
  };
  const pickByok = () => {
    setPreferredSource("byok");
    setView("main");
  };

  // Always reopen on the main view.
  useEffect(() => {
    if (!open) setView("main");
  }, [open]);

  // Warm the shared entitlement/model catalog after the editor has settled. If
  // the user opens immediately, the open-triggered refresh joins the same request.
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 800);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const strengthLabel = t(`aiLab.picker.strength.${strength}`);
  const modelLabel =
    preferredSource === "byok"
      ? byokModel || t("aiLab.picker.auto")
      : preferredSource === "internal"
        ? selectedModel || t("aiLab.picker.auto")
        : t("aiLab.picker.auto");

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onPointerEnter={() => void refresh()}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
          "border-white/[0.08] bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06] disabled:opacity-40",
          open && "border-sky-400/40 bg-sky-400/[0.06]",
        )}
      >
        <Sparkles size={13} className="shrink-0 text-sky-300/80" />
        <span className="truncate">
          {modelLabel} · {strengthLabel}
        </span>
        <ChevronUp
          size={13}
          className={cn(
            "shrink-0 text-neutral-500 transition-transform",
            !open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-72 origin-bottom rounded-2xl border border-white/[0.06] bg-neutral-900/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl"
          >
            {view === "main" ? (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* selected model → opens the model submenu */}
                <button
                  type="button"
                  onClick={() => setView("models")}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
                      {t("aiLab.picker.model")}
                    </span>
                    <span className="mt-0.5 block truncate text-[14px] text-neutral-100">
                      {modelLabel}
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-neutral-500"
                  />
                </button>

                <div className="my-2 h-px bg-white/[0.06]" />

                {/* strength slider */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-[12px] text-neutral-300">
                    {t("aiLab.picker.strengthLabel")}
                  </span>
                  <span className="text-[12px] text-sky-300">
                    {strengthLabel}
                  </span>
                </div>
                <StrengthSlider value={strength} onChange={setStrength} t={t} />
              </motion.div>
            ) : (
              <motion.div
                key="models"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* back to main */}
                <button
                  type="button"
                  onClick={() => setView("main")}
                  className="mb-1 flex w-full items-center gap-1 rounded-lg px-1.5 py-1.5 text-left text-[12px] text-neutral-400 transition-colors hover:bg-white/[0.04]"
                >
                  <ChevronLeft size={15} className="shrink-0" />
                  {t("aiLab.picker.model")}
                </button>

                <div className="max-h-64 overflow-y-auto scrollbar-hide">
                  {/* Auto: system decides (internal → byok) */}
                  <ModelRow
                    label={t("aiLab.picker.auto")}
                    sub={t("aiLab.picker.autoHint")}
                    active={preferredSource === "auto"}
                    onClick={pickAuto}
                  />

                  {/* Internal credits — selectable only when entitled */}
                  {internalModels.length > 0 && (
                    <>
                      <GroupHeader
                        label={t("aiLab.picker.internalGroup")}
                        hint={
                          canInternal
                            ? undefined
                            : t("aiLab.picker.needCredits")
                        }
                      />
                      {internalModels.map((m) => (
                        <ModelRow
                          key={m}
                          label={m}
                          active={
                            preferredSource === "internal" &&
                            selectedModel === m
                          }
                          disabled={!canInternal}
                          onClick={() => pickInternal(m)}
                        />
                      ))}
                    </>
                  )}

                  {loading && internalModels.length === 0 && (
                    <div className="px-2 py-2 text-[11px] text-neutral-500">
                      {t("aiLab.picker.loadingModels")}
                    </div>
                  )}

                  {/* Custom model — the user's own key */}
                  <GroupHeader label={t("aiLab.picker.customGroup")} />
                  {hasByok ? (
                    <ModelRow
                      label={byokModel}
                      active={preferredSource === "byok"}
                      onClick={pickByok}
                    />
                  ) : (
                    <p className="px-2 py-1.5 text-[12px] text-neutral-500">
                      {t("aiLab.picker.addCustom")}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between px-2 pb-1 pt-2.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
        {label}
      </span>
      {hint && <span className="text-[10px] text-amber-400/70">{hint}</span>}
    </div>
  );
}

function ModelRow({
  label,
  sub,
  active,
  disabled,
  onClick,
}: {
  label: string;
  sub?: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : active
            ? "bg-white/[0.06] text-neutral-50"
            : "text-neutral-300 hover:bg-white/[0.035]",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-[13px]">{label}</span>
        {sub && (
          <span className="block truncate text-[11px] text-neutral-500">
            {sub}
          </span>
        )}
      </span>
      {active && <Check size={14} className="shrink-0 text-sky-400" />}
    </button>
  );
}

function StrengthSlider({
  value,
  onChange,
  t,
}: {
  value: Strength;
  onChange: (s: Strength) => void;
  t: (k: string) => string;
}) {
  const index = STRENGTHS.indexOf(value);
  const last = STRENGTHS.length - 1;
  const frac = index / last;
  const railRef = useRef<HTMLDivElement>(null);

  // Map a pointer x onto the inner rail (thumb travels between the dot stops) and
  // snap to the nearest discrete strength.
  const pickFromClientX = (clientX: number) => {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(STRENGTHS[Math.round(ratio * last)]);
  };

  return (
    <div className="px-2 pb-1.5 pt-2.5">
      <div
        role="slider"
        tabIndex={0}
        aria-label={t("aiLab.picker.strengthLabel")}
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index}
        aria-valuetext={t(`aiLab.picker.strength.${value}`)}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          pickFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 0) pickFromClientX(e.clientX);
        }}
        onKeyDown={(e) => {
          if ((e.key === "ArrowLeft" || e.key === "ArrowDown") && index > 0) {
            e.preventDefault();
            onChange(STRENGTHS[index - 1]);
          } else if (
            (e.key === "ArrowRight" || e.key === "ArrowUp") &&
            index < last
          ) {
            e.preventDefault();
            onChange(STRENGTHS[index + 1]);
          }
        }}
        className="relative h-7 cursor-pointer touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
      >
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 h-6 -translate-y-1/2 rounded-full bg-white/[0.08]" />
        {/* filled — from the left cap up to the thumb centre */}
        <div
          className="absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-full bg-sky-400 transition-[width] duration-200 ease-out"
          style={{ width: `calc(0.875rem + (100% - 1.75rem) * ${frac})` }}
        />
        {/* inner rail: dot stops + thumb centres live here (inset by the thumb radius) */}
        <div
          ref={railRef}
          className="pointer-events-none absolute inset-y-0 left-3.5 right-3.5"
        >
          {STRENGTHS.map((s, i) =>
            i === index ? null : (
              <span
                key={s}
                className={cn(
                  "absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200",
                  i < index ? "bg-white/70" : "bg-white/25",
                )}
                style={{ left: `${(i / last) * 100}%` }}
              />
            ),
          )}
          {/* thumb */}
          <span
            className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md shadow-black/40 ring-1 ring-black/5 transition-[left] duration-200 ease-out"
            style={{ left: `${frac * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModelConfigFields } from "@/components/llm/ModelConfigFields";
import { McpAccessSection } from "@/app/dashboard/settings/_components/McpAccessSection";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSettingStore } from "@/store/useSettingStore";
import { useTheme, type ThemePreference } from "@/components/providers/ThemeProvider";
import { useAccountUiStore, type SettingsSection } from "@/store/useAccountUiStore";
import { isCloudMode } from "@/lib/config/app";
import { cn } from "@/lib/utils";

type Category = {
  key: SettingsSection;
  labelKey: string;
  cloudOnly?: boolean;
};

const CATEGORIES: Category[] = [
  { key: "general", labelKey: "account.settings.nav.general" },
  { key: "model", labelKey: "account.settings.nav.model" },
  { key: "cloudSync", labelKey: "account.settings.nav.cloudSync", cloudOnly: true },
  { key: "mcp", labelKey: "account.settings.nav.mcp", cloudOnly: true },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Settings modal — "instrument panel". A numbered channel rail on the left, and
 * on the right a restrained definition-list of settings (label + helper, control
 * right-aligned) rather than stacked cards. Reuses the existing settings pieces
 * (ModelConfigFields, McpAccessSection, cloud-sync + disclaimer) and the shared
 * useSettingStore, so this only re-lays-out — no logic is duplicated. Cloud-only
 * channels are filtered in self-hosted mode.
 */
export function SettingsModal() {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const { theme, setTheme } = useTheme();
  const { settingsOpen, settingsSection, closeSettings, openSettings } = useAccountUiStore();
  const {
    cloudSync,
    syncDisclaimerAgreed,
    setCloudSync,
    setSyncDisclaimerAgreed,
    hasLlmConfig,
    isDirty,
    saveSettings,
    resetSettings,
    loadSettings,
  } = useSettingStore();

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Refresh the saved baseline each time the modal opens.
  useEffect(() => {
    if (settingsOpen) loadSettings();
  }, [settingsOpen, loadSettings]);

  const categories = useMemo(() => CATEGORIES.filter((c) => !c.cloudOnly || isCloudMode), []);
  const active = categories.some((c) => c.key === settingsSection) ? settingsSection : "general";
  const currentLang = i18n.language.startsWith("en") ? "en" : "zh";

  const handleSave = () => {
    saveSettings();
    toast.success(t("settings.notifications.settingsSaved"));
  };
  const handleReset = () => {
    resetSettings();
    toast.info(t("settings.notifications.changesReset"));
  };
  const handleCloudSyncToggle = (checked: boolean) => {
    if (checked && !syncDisclaimerAgreed) setShowDisclaimer(true);
    else setCloudSync(checked);
  };
  const handleConfirmDisclaimer = () => {
    setSyncDisclaimerAgreed(true);
    setCloudSync(true);
    setShowDisclaimer(false);
  };

  // Active-channel marker: a bottom underline on the mobile tab strip, a left bar
  // on the sm+ vertical rail. Same element so framer's layoutId slides it.
  const railMarkerClass =
    "pointer-events-none absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-sky-400 sm:bottom-auto sm:left-0 sm:right-auto sm:top-1/2 sm:h-5 sm:w-[3px] sm:-translate-y-1/2";

  return (
    <ModalShell
      open={settingsOpen}
      onOpenChange={(open) => !open && closeSettings()}
      title={t("account.settings.title")}
      className="h-[min(700px,88vh)] w-[min(980px,92vw)]"
    >
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        {/* channel rail — horizontal tab strip on mobile, vertical rail on sm+ */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto scrollbar-hide border-b border-white/[0.06] px-3 py-2 sm:w-[196px] sm:flex-col sm:gap-0.5 sm:overflow-x-visible sm:overflow-y-auto sm:border-b-0 sm:border-r sm:py-4">
          {categories.map(({ key, labelKey }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => openSettings(key)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 sm:w-full sm:gap-3 sm:pl-4 sm:pr-3",
                  isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.025]",
                )}
              >
                {isActive &&
                  (reduce ? (
                    <span className={railMarkerClass} />
                  ) : (
                    <motion.span
                      layoutId="settings-rail-marker"
                      transition={{ duration: 0.24, ease: EASE }}
                      className={railMarkerClass}
                    />
                  ))}
                <span
                  className={cn(
                    "whitespace-nowrap text-[13.5px] transition-colors",
                    isActive
                      ? "font-medium text-neutral-100"
                      : "text-neutral-400 group-hover:text-neutral-200",
                  )}
                >
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </nav>

        {/* right pane + save bar */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide px-5 py-6 sm:px-9 sm:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: EASE }}
              >
                {active === "general" && (
                  <Pane
                    title={t("account.settings.nav.general")}
                    description={t("account.settings.general.description")}
                  >
                    <SettingList>
                      <SettingRow
                        label={t("account.settings.general.appearance")}
                        description={t("account.settings.general.appearanceDescription")}
                      >
                        <Segmented
                          groupId="appearance"
                          value={theme}
                          reduce={reduce}
                          onChange={(next: ThemePreference) => setTheme(next)}
                          options={[
                            { value: "dark", label: t("account.settings.general.appearanceDark") },
                            { value: "light", label: t("account.settings.general.appearanceLight") },
                            { value: "system", label: t("account.settings.general.appearanceSystem") },
                          ]}
                        />
                      </SettingRow>
                      <SettingRow
                        label={t("account.settings.general.language")}
                        description={t("account.settings.general.languageDescription")}
                      >
                        <Segmented
                          groupId="language"
                          value={currentLang}
                          reduce={reduce}
                          onChange={(code) => i18n.changeLanguage(code)}
                          options={[
                            { value: "en", label: "English" },
                            { value: "zh", label: "中文" },
                          ]}
                        />
                      </SettingRow>
                    </SettingList>
                  </Pane>
                )}

                {active === "model" && (
                  <Pane
                    title={t("account.settings.nav.model")}
                    description={t("settings.llm.description")}
                    badge={
                      hasLlmConfig() ? (
                        <StatusBadge tone="ready">{t("settings.llm.statusReady")}</StatusBadge>
                      ) : (
                        <StatusBadge tone="pending">{t("settings.llm.statusNotConfigured")}</StatusBadge>
                      )
                    }
                  >
                    <div className="mt-6">
                      <ModelConfigFields />
                    </div>
                  </Pane>
                )}

                {active === "cloudSync" && isCloudMode && (
                  <Pane
                    title={t("account.settings.nav.cloudSync")}
                    description={t("settings.cloudSync.description")}
                  >
                    <SettingList>
                      <SettingRow
                        label={t("settings.cloudSync.toggleLabel")}
                        description={cloudSync ? t("settings.cloudSync.statusOn") : t("settings.cloudSync.statusOff")}
                      >
                        <Switch checked={cloudSync} onCheckedChange={handleCloudSyncToggle} />
                      </SettingRow>
                    </SettingList>
                  </Pane>
                )}

                {active === "mcp" && isCloudMode && (
                  <Pane title={t("account.settings.nav.mcp")} description={t("settings.mcp.description")}>
                    <div className="mt-6 [&_section]:mx-0 [&_section]:max-w-none">
                      <McpAccessSection showHeader={false} />
                    </div>
                  </Pane>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isDirty && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="flex shrink-0 items-center gap-3 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3.5 sm:px-9"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                <p className="mr-auto text-[12.5px] text-neutral-400">{t("settings.notifications.unsavedChanges")}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 rounded-full px-4 text-[13px] text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-100"
                >
                  {t("settings.buttons.reset")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="h-9 rounded-full bg-sky-500 px-5 text-[13px] font-semibold text-[#fff] shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400"
                >
                  {t("settings.buttons.save")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cloud Sync disclaimer — nested dialog, same flow as the settings page */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-md rounded-2xl border-neutral-800 bg-neutral-900 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Cloud className="h-6 w-6 text-sky-400" />
              {t("settings.cloudSync.disclaimer.title")}
            </DialogTitle>
            <DialogDescription className="pt-2 text-neutral-400">
              {t("settings.cloudSync.disclaimer.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4 text-sm leading-relaxed text-neutral-300">
            {t("settings.cloudSync.disclaimer.content")}
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDisclaimer(false)}
              className="rounded-full text-neutral-400 hover:bg-neutral-800"
            >
              {t("settings.cloudSync.disclaimer.cancel")}
            </Button>
            <Button
              onClick={handleConfirmDisclaimer}
              className="rounded-full bg-sky-500 px-6 font-medium text-[#fff] hover:bg-sky-400"
            >
              {t("settings.cloudSync.disclaimer.agree")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalShell>
  );
}

function Pane({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[640px]">
      <div className="flex items-baseline gap-3">
        <h3 className="text-[22px] font-semibold leading-none tracking-tight text-neutral-50">{title}</h3>
        {badge && <span className="ml-auto self-center">{badge}</span>}
      </div>
      {description && (
        <p className="mt-3 max-w-[58ch] text-[13px] leading-relaxed text-neutral-500">{description}</p>
      )}
      {children}
    </div>
  );
}

/** Small status pill — reserves emerald/amber only for genuine readiness semantics. */
function StatusBadge({ tone, children }: { tone: "ready" | "pending"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        tone === "ready" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone === "ready" ? "bg-emerald-400" : "bg-amber-400")} />
      {children}
    </span>
  );
}

/** Hairline-separated settings list — no per-row cards. */
function SettingList({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-7 divide-y divide-white/[0.06] border-t border-white/[0.06]">{children}</div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-8 py-5">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-neutral-100">{label}</p>
        {description && <p className="mt-1.5 max-w-[46ch] text-[12.5px] leading-relaxed text-neutral-500">{description}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

/** Segmented toggle with a sliding sky thumb (transform-only, reduced-motion aware). */
function Segmented<T extends string>({
  groupId,
  value,
  onChange,
  options,
  reduce,
}: {
  groupId: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; disabled?: boolean; tag?: string }[];
  reduce: boolean | null;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-[10px] bg-sunk p-1 ring-1 ring-inset ring-white/[0.06]">
      {options.map((opt) => {
        const isActive = value === opt.value && !opt.disabled;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={cn(
              "relative inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3.5 text-[12.5px] transition-colors",
              opt.disabled
                ? "cursor-not-allowed text-neutral-600"
                : isActive
                  ? "font-medium text-[#fff]"
                  : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {isActive &&
              (reduce ? (
                <span className="absolute inset-0 rounded-[7px] bg-sky-500" />
              ) : (
                <motion.span
                  layoutId={`segmented-${groupId}`}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="absolute inset-0 rounded-[7px] bg-sky-500 shadow-sm shadow-sky-500/25"
                />
              ))}
            <span className="relative z-10">{opt.label}</span>
            {opt.tag && <span className="relative z-10 text-[10.5px] text-neutral-600">{opt.tag}</span>}
          </button>
        );
      })}
    </div>
  );
}

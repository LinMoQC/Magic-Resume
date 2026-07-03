"use client";

import React, { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MagicTemplateDSL } from "@magic-resume/resume-templates/types/magic-dsl";
import ResumeMiniPreview from "../../../_components/ResumeMiniPreview";
import { cn } from "@/lib/utils";

type TemplateStoreModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: MagicTemplateDSL[];
  currentTemplateId: string;
  onSelect: (templateId: string) => void;
};

export default function TemplateStoreModal({
  open,
  onOpenChange,
  templates,
  currentTemplateId,
  onSelect,
}: TemplateStoreModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (tpl) =>
        tpl.name.toLowerCase().includes(q) ||
        tpl.description?.toLowerCase().includes(q) ||
        tpl.tags?.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [templates, query]);

  const pick = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden border-white/10 bg-[#0A0A0A] p-0">
        <DialogHeader className="space-y-3 border-b border-white/[0.06] px-6 py-5 text-left">
          <div className="flex items-end justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                {t("templateStore.title")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] text-neutral-400">
                {t("templateStore.subtitle")}
              </DialogDescription>
            </div>
            <div className="relative w-56 shrink-0">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("templateStore.search")}
                className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-[13px] text-neutral-100 outline-none transition-colors duration-150 placeholder:text-neutral-600 hover:border-white/20 focus:border-sky-400/60"
              />
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 overflow-y-auto px-6 py-6 scrollbar-hide sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((tpl) => {
            const selected = tpl.id === currentTemplateId;
            return (
              <motion.button
                key={tpl.id}
                type="button"
                onClick={() => pick(tpl.id)}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className="group flex flex-col text-left"
              >
                <div
                  className={cn(
                    "relative aspect-[3/4] overflow-hidden rounded-xl border bg-neutral-900 transition-colors duration-150",
                    selected
                      ? "border-sky-400 shadow-lg shadow-sky-500/20"
                      : "border-white/10 group-hover:border-white/25",
                  )}
                >
                  <div className="h-full w-full p-2">
                    <ResumeMiniPreview template={tpl} />
                  </div>
                  {selected && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-400 text-[#0A0A0A] shadow">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-2.5 truncate text-[13px] font-semibold tracking-tight transition-colors",
                    selected ? "text-sky-300" : "text-neutral-200 group-hover:text-white",
                  )}
                >
                  {tpl.name}
                </p>
                {tpl.description && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-500">
                    {tpl.description}
                  </p>
                )}
              </motion.button>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-neutral-500">
              {t("templateStore.empty")}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

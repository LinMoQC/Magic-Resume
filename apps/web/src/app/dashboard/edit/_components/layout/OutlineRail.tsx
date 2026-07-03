"use client";

import React from "react";
import {
  User,
  FileText,
  BriefcaseBusiness,
  GraduationCap,
  FolderKanban,
  Zap,
  Globe,
  Award,
  Contact,
  PanelLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import AccountMenu from "@/components/shared/AccountMenu";

export const LEFT_RAIL_WIDTH = 52;
// 与右侧自定义面板等宽(rail 52 + panel 360 = 412),保证展开时左右对称
export const LEFT_PANEL_WIDTH = 360;
/** 左侧整体宽度 = 画布的 marginLeft,与右侧 rightPanelWidth 同构 */
export const leftPanelWidth = (collapsed: boolean) =>
  collapsed ? LEFT_RAIL_WIDTH : LEFT_RAIL_WIDTH + LEFT_PANEL_WIDTH;

type Meta = { icon: React.ComponentType<{ size?: number | string; className?: string }>; labelKey?: string };

const SECTION_META: Record<string, Meta> = {
  basics: { icon: User, labelKey: "editPage.sections.basics" },
  summary: { icon: FileText, labelKey: "sections.summary" },
  experience: { icon: BriefcaseBusiness, labelKey: "sections.experience" },
  education: { icon: GraduationCap, labelKey: "sections.education" },
  projects: { icon: FolderKanban, labelKey: "sections.projects" },
  skills: { icon: Zap, labelKey: "sections.skills" },
  languages: { icon: Globe, labelKey: "sections.languages" },
  certificates: { icon: Award, labelKey: "sections.certificates" },
  profiles: { icon: Contact, labelKey: "sections.profiles" },
};

export function sectionMeta(key: string): Meta {
  return SECTION_META[key] ?? { icon: FileText };
}

type OutlineRailProps = {
  sectionOrder: { key: string; label: string }[];
  activeSection: string;
  collapsed: boolean;
  onJump: (key: string) => void;
  onToggleCollapse: () => void;
};

export default function OutlineRail({
  sectionOrder,
  activeSection,
  collapsed,
  onJump,
  onToggleCollapse,
}: OutlineRailProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-full shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] bg-[#0A0A0A] py-3"
      style={{ width: LEFT_RAIL_WIDTH }}
    >
      <RailButton
        label={collapsed ? t("common.expand") : t("common.collapse")}
        onClick={onToggleCollapse}
      >
        <PanelLeft size={18} />
      </RailButton>

      <div className="my-1.5 h-px w-6 bg-white/[0.08]" />

      <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto scrollbar-hide">
        {sectionOrder.map(({ key, label }) => {
          const meta = sectionMeta(key);
          const Icon = meta.icon;
          const name = meta.labelKey ? t(meta.labelKey) : label;
          return (
            <RailButton
              key={key}
              label={name}
              active={!collapsed && activeSection === key}
              onClick={() => onJump(key)}
            >
              <Icon size={18} />
            </RailButton>
          );
        })}
      </div>

      <div className="mt-2 flex shrink-0 flex-col items-center gap-2.5 pt-2">
        <div className="h-px w-6 bg-white/[0.08]" />
        <AccountMenu placement="right" />
      </div>
    </div>
  );
}

function RailButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
        active ? "bg-sky-400/10 text-sky-300" : "text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200",
      )}
    >
      {children}
      {active && (
        <span className="absolute -right-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-sky-400" />
      )}
      <span className="pointer-events-none absolute left-11 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

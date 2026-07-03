"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import OutlineRail, { LEFT_PANEL_WIDTH } from "./OutlineRail";

type EditorFormPanelProps = {
  renderSections: () => React.ReactNode;
  sectionOrder?: { key: string; label: string }[];
  activeSection?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onJump?: (key: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
  /** 移动端抽屉内嵌:无图标轨、无折叠、占满容器 */
  embedded?: boolean;
};

export default function EditorFormPanel({
  renderSections,
  sectionOrder = [],
  activeSection = "",
  collapsed = false,
  onToggleCollapse = () => {},
  onJump = () => {},
  scrollRef,
  onScroll,
  embedded = false,
}: EditorFormPanelProps) {
  const { t } = useTranslation();

  if (embedded) {
    return (
      <div className="flex h-full w-full flex-col bg-[#0A0A0A]">
        <div className="flex items-center border-b border-white/[0.06] px-4 py-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-white">{t("outline.title")}</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 scrollbar-hide">
          {renderSections()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 z-40 flex h-screen">
      <OutlineRail
        sectionOrder={sectionOrder}
        activeSection={activeSection}
        collapsed={collapsed}
        onJump={onJump}
        onToggleCollapse={onToggleCollapse}
      />

      <motion.div
        className="h-full overflow-hidden border-r border-white/[0.06] bg-[#0A0A0A]"
        animate={{ width: collapsed ? 0 : LEFT_PANEL_WIDTH }}
        initial={false}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        <div style={{ width: LEFT_PANEL_WIDTH }} className="flex h-full flex-col">
          <div className="flex items-center border-b border-white/[0.06] px-4 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight text-white">{t("outline.title")}</h2>
          </div>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 scrollbar-hide"
          >
            {renderSections()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

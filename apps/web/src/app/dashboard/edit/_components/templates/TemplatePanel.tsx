"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Shapes,
  LayoutGrid,
  Type,
  Palette,
  PanelRight,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { getTemplateManifestList } from "@magic-resume/resume-templates/config/magic-templates";
import { MagicTemplateDSL } from "@magic-resume/resume-templates/types/magic-dsl";

import { useResumeStore } from "@/store/useResumeStore";
import { extractCustomConfig, mergeTemplateConfig } from "@/lib/utils/templateUtils";
import { parseCssPixelValue } from "@/lib/utils/css";
import { cn } from "@/lib/utils";
import ResumeMiniPreview from "../../../_components/ResumeMiniPreview";
import TemplateStoreModal from "./TemplateStoreModal";
import {
  AccordionSection,
  ColorField,
  COLOR_THEMES,
  FontField,
  GroupLabel,
  PANEL_FONTS,
  PANEL_PRESET_COLORS,
  SegmentedField,
  SliderField,
  ThemeSwatches,
  ToggleField,
} from "./controls";

export const RAIL_WIDTH = 52;
export const PANEL_WIDTH = 360;
/**
 * 右侧面板实际宽度 = 画布的 marginRight。不再额外加 gap:
 * 画布在「左面板边 ~ 右面板边」之间居中,留白由居中自然产生 → 左右外边距对称。
 */
export const rightPanelWidth = (collapsed: boolean) =>
  collapsed ? RAIL_WIDTH : RAIL_WIDTH + PANEL_WIDTH;

type SectionId = "template" | "layout" | "typography" | "colors";

type TemplatePanelProps = {
  rightCollapsed: boolean;
  setRightCollapsed: (collapsed: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
  currentTemplateId: string;
  onTemplateUpdate?: (template: MagicTemplateDSL) => void;
  /** 移动端抽屉内嵌:无固定定位、无图标轨、占满容器 */
  embedded?: boolean;
};

export default function TemplatePanel({
  rightCollapsed,
  setRightCollapsed,
  onSelectTemplate,
  currentTemplateId,
  onTemplateUpdate,
  embedded = false,
}: TemplatePanelProps) {
  const { t } = useTranslation();
  const { updateCustomTemplate, activeResume } = useResumeStore();

  const [templates, setTemplates] = useState<MagicTemplateDSL[]>([]);
  const [storeOpen, setStoreOpen] = useState(false);
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    template: true,
    layout: false,
    typography: false,
    colors: true,
  });
  const [active, setActive] = useState<SectionId>("template");
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const manifests = getTemplateManifestList();
    setTemplates(
      manifests.map((m) => ({
        ...m.template,
        name: m.name,
        description: m.description,
        tags: m.tags,
        status: m.status,
        thumbnailUrl: m.thumbnailUrl,
      })),
    );
  }, []);

  const baseTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === currentTemplateId) ?? templates[0],
    [templates, currentTemplateId],
  );

  // 基础模板叠加用户自定义差异 = 控件实际展示 / 编辑的对象(随 store 实时重算)
  const working = useMemo(
    () => (baseTemplate ? mergeTemplateConfig(baseTemplate, activeResume?.customTemplate) : null),
    [baseTemplate, activeResume?.customTemplate],
  );

  // 页眉控件仅当模板含 Header 组件时显示(Header 完整消费这些 props)。
  const headerComponent = useMemo(
    () => working?.components.find((c) => c.type === "Header"),
    [working],
  );
  const headerProps = (headerComponent?.props ?? {}) as {
    avatarPosition?: "left" | "right";
    avatarWidth?: number;
    avatarRounded?: boolean;
    contactStyle?: "icon" | "label";
  };

  const hasCustomizations = useMemo(() => {
    const c = activeResume?.customTemplate;
    return !!c && Object.keys(c).length > 0;
  }, [activeResume?.customTemplate]);

  // 把整份模板的改动落成「差异」写回 store(预览即时刷新)
  const applyTemplate = useCallback(
    (updated: MagicTemplateDSL) => {
      if (!baseTemplate) return;
      updateCustomTemplate(extractCustomConfig(baseTemplate, updated) || {});
      onTemplateUpdate?.(updated);
    },
    [baseTemplate, updateCustomTemplate, onTemplateUpdate],
  );

  const updateColors = useCallback(
    (patch: Partial<MagicTemplateDSL["designTokens"]["colors"]>) => {
      if (!working) return;
      applyTemplate({
        ...working,
        designTokens: {
          ...working.designTokens,
          colors: { ...working.designTokens.colors, ...patch },
        },
      });
    },
    [working, applyTemplate],
  );

  const updateTypography = useCallback(
    (patch: Partial<MagicTemplateDSL["designTokens"]["typography"]>) => {
      if (!working) return;
      applyTemplate({
        ...working,
        designTokens: {
          ...working.designTokens,
          typography: { ...working.designTokens.typography, ...patch },
        },
      });
    },
    [working, applyTemplate],
  );

  const updateLayout = useCallback(
    (patch: Partial<MagicTemplateDSL["layout"]>) => {
      if (!working) return;
      applyTemplate({ ...working, layout: { ...working.layout, ...patch } });
    },
    [working, applyTemplate],
  );

  // 头像 / 页眉:改动落到 Header / ProfileCard 组件的 props(经 extract/merge round-trip)。
  const updateHeader = useCallback(
    (patch: Record<string, unknown>) => {
      if (!working) return;
      applyTemplate({
        ...working,
        components: working.components.map((c) =>
          c.type === "Header" || c.type === "ProfileCard"
            ? { ...c, props: { ...c.props, ...patch } }
            : c,
        ),
      });
    },
    [working, applyTemplate],
  );

  const updateSpacingScale = useCallback(
    (baseRem: number) => {
      if (!working) return;
      const md = Number(Math.min(3, Math.max(0.5, baseRem)).toFixed(2));
      const sm = Math.max(0.25, Number((md * 0.67).toFixed(2)));
      const lg = Math.max(md + 0.25, Number((md * 1.33).toFixed(2)));
      applyTemplate({
        ...working,
        designTokens: {
          ...working.designTokens,
          spacing: { ...working.designTokens.spacing, sm: `${sm}rem`, md: `${md}rem`, lg: `${lg}rem` },
        },
      });
    },
    [working, applyTemplate],
  );

  const resetCustomizations = useCallback(() => updateCustomTemplate({}), [updateCustomTemplate]);

  const toggleSection = useCallback((id: SectionId) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    setActive(id);
  }, []);

  const jumpTo = useCallback(
    (id: SectionId) => {
      const go = () => {
        setOpen((prev) => ({ ...prev, [id]: true }));
        setActive(id);
        requestAnimationFrame(() => {
          sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      };
      if (rightCollapsed && !embedded) {
        setRightCollapsed(false);
        window.setTimeout(go, 240);
      } else {
        go();
      }
    },
    [rightCollapsed, embedded, setRightCollapsed],
  );

  // 滚动高亮:取顶部最近的分区(用 rect 相对容器,避免 offsetParent 影响)
  const onScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;
    let current: SectionId = "template";
    (["template", "layout", "typography", "colors"] as SectionId[]).forEach((id) => {
      const el = sectionRefs.current[id];
      if (el && el.getBoundingClientRect().top - containerTop <= 28) current = id;
    });
    setActive(current);
  }, []);

  const railItems: { id: SectionId; icon: React.ReactNode; label: string }[] = [
    { id: "template", icon: <Shapes size={18} />, label: t("templateCustomizer.sections.template") },
    { id: "layout", icon: <LayoutGrid size={18} />, label: t("templateCustomizer.sections.layout") },
    { id: "typography", icon: <Type size={18} />, label: t("templateCustomizer.sections.typography") },
    { id: "colors", icon: <Palette size={18} />, label: t("templateCustomizer.sections.colors") },
  ];

  const sectionsContent = working && baseTemplate && (
    <>
      {/* Template */}
      <AccordionSection
        sectionId="template"
        icon={<Shapes size={16} />}
        title={t("templateCustomizer.sections.template")}
        open={open.template}
        onToggle={() => toggleSection("template")}
        registerRef={(el) => (sectionRefs.current.template = el)}
      >
        <button
          type="button"
          onClick={() => setStoreOpen(true)}
          className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition duration-150 active:scale-[0.99] hover:border-sky-400/40 hover:bg-white/[0.05]"
        >
          <div className="h-20 w-[60px] shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-900 p-1">
            <ResumeMiniPreview template={working} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-white">{baseTemplate.name}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-500">
              {baseTemplate.description}
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-sky-300">
              {t("templatePanel.change")}
              <ChevronRight size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </div>
        </button>

        {baseTemplate.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {baseTemplate.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </AccordionSection>

      {/* Layout */}
      <AccordionSection
        sectionId="layout"
        icon={<LayoutGrid size={16} />}
        title={t("templateCustomizer.sections.layout")}
        open={open.layout}
        onToggle={() => toggleSection("layout")}
        registerRef={(el) => (sectionRefs.current.layout = el)}
      >
        <SegmentedField
          label={t("templateCustomizer.layout.pageSize")}
          options={[
            { label: "A4", value: "A4" },
            { label: "Letter", value: "Letter" },
          ]}
          value={working.layout.pageSize ?? "A4"}
          onChange={(v) =>
            // 切换纸张同时把 containerWidth 设为该规格标准页宽(A4 794 / Letter 816)。
            updateLayout({ pageSize: v as "A4" | "Letter", containerWidth: v === "Letter" ? "816px" : "794px" })
          }
        />
        <SegmentedField
          label={t("templateCustomizer.layout.density")}
          options={[
            { label: t("templateCustomizer.layout.densityCompact"), value: 0.5 },
            { label: t("templateCustomizer.layout.densityNormal"), value: 1 },
            { label: t("templateCustomizer.layout.densityRelaxed"), value: 1.5 },
          ]}
          value={parseFloat(working.designTokens.spacing.md)}
          onChange={(v) => updateSpacingScale(v)}
        />

        <SliderField
          label={t("templateCustomizer.layout.containerWidth")}
          value={parseCssPixelValue(working.layout.containerWidth)}
          min={600}
          max={1000}
          step={10}
          display={working.layout.containerWidth}
          onChange={(v) => updateLayout({ containerWidth: `${v}px` })}
        />
        <SliderField
          label={t("templateCustomizer.layout.padding")}
          value={parseCssPixelValue(working.layout.padding)}
          min={8}
          max={48}
          step={2}
          display={working.layout.padding}
          onChange={(v) => updateLayout({ padding: `${v}px` })}
        />
        <SliderField
          label={t("templateCustomizer.layout.gap")}
          value={parseCssPixelValue(working.layout.gap)}
          min={8}
          max={48}
          step={2}
          display={working.layout.gap}
          onChange={(v) => updateLayout({ gap: `${v}px` })}
        />

        {/* 两栏比例:仅两栏模板可见。leftWidth = 固定侧栏宽,gap = 栏间距;
            rightWidth 恒为 1fr(填满剩余),不暴露。 */}
        {working.layout.type === "two-column" && working.layout.twoColumn && (
          <>
            <SliderField
              label={t("templateCustomizer.layout.sidebarWidth")}
              value={parseCssPixelValue(working.layout.twoColumn.leftWidth)}
              min={160}
              max={360}
              step={10}
              display={working.layout.twoColumn.leftWidth}
              onChange={(v) =>
                updateLayout({
                  twoColumn: {
                    leftWidth: `${v}px`,
                    rightWidth: working.layout.twoColumn?.rightWidth ?? "1fr",
                    gap: working.layout.twoColumn?.gap ?? "0",
                  },
                })
              }
            />
            <SliderField
              label={t("templateCustomizer.layout.columnGap")}
              value={parseCssPixelValue(working.layout.twoColumn.gap)}
              min={0}
              max={48}
              step={2}
              display={working.layout.twoColumn.gap}
              onChange={(v) =>
                updateLayout({
                  twoColumn: {
                    leftWidth: working.layout.twoColumn?.leftWidth ?? "280px",
                    rightWidth: working.layout.twoColumn?.rightWidth ?? "1fr",
                    gap: `${v}px`,
                  },
                })
              }
            />
          </>
        )}

        <div className="space-y-4 pt-1">
          <ToggleField
            label={t("templateCustomizer.layout.titleDivider")}
            description={t("templateCustomizer.layout.titleDividerDesc")}
            checked={working.layout.showTitleDivider !== false}
            onChange={(v) => updateLayout({ showTitleDivider: v })}
          />
          <ToggleField
            label={t("templateCustomizer.layout.titleIcon")}
            description={t("templateCustomizer.layout.titleIconDesc")}
            checked={working.layout.showTitleIcon !== false}
            onChange={(v) => updateLayout({ showTitleIcon: v })}
          />
        </div>

        {/* 头像 / 页眉:仅含 Header 组件的模板显示 */}
        {headerComponent && (
          <div className="space-y-5 pt-1">
            <GroupLabel>{t("templateCustomizer.header.title")}</GroupLabel>
            <SegmentedField
              label={t("templateCustomizer.header.avatarShape")}
              options={[
                { label: t("templateCustomizer.header.shapeRound"), value: "round" },
                { label: t("templateCustomizer.header.shapeSquare"), value: "square" },
              ]}
              value={headerProps.avatarRounded === false ? "square" : "round"}
              onChange={(v) => updateHeader({ avatarRounded: v === "round" })}
            />
            <SegmentedField
              label={t("templateCustomizer.header.avatarPosition")}
              options={[
                { label: t("templateCustomizer.header.positionLeft"), value: "left" },
                { label: t("templateCustomizer.header.positionRight"), value: "right" },
              ]}
              value={headerProps.avatarPosition ?? "left"}
              onChange={(v) => updateHeader({ avatarPosition: v })}
            />
            <SliderField
              label={t("templateCustomizer.header.avatarSize")}
              value={headerProps.avatarWidth ?? 40}
              min={32}
              max={96}
              step={4}
              display={`${headerProps.avatarWidth ?? 40}px`}
              onChange={(v) => updateHeader({ avatarWidth: v, avatarHeight: v })}
            />
            <SegmentedField
              label={t("templateCustomizer.header.contactStyle")}
              options={[
                { label: t("templateCustomizer.header.contactIcon"), value: "icon" },
                { label: t("templateCustomizer.header.contactLabel"), value: "label" },
              ]}
              value={headerProps.contactStyle ?? "icon"}
              onChange={(v) => updateHeader({ contactStyle: v })}
            />
          </div>
        )}
      </AccordionSection>

      {/* Typography */}
      <AccordionSection
        sectionId="typography"
        icon={<Type size={16} />}
        title={t("templateCustomizer.sections.typography")}
        open={open.typography}
        onToggle={() => toggleSection("typography")}
        registerRef={(el) => (sectionRefs.current.typography = el)}
      >
        <FontField
          label={t("templateCustomizer.typography.primaryFont")}
          value={working.designTokens.typography.fontFamily.primary}
          onChange={(font) =>
            updateTypography({
              fontFamily: { ...working.designTokens.typography.fontFamily, primary: font },
            })
          }
          fonts={PANEL_FONTS}
        />
        <div className="space-y-5 pt-1">
          <GroupLabel>{t("templateCustomizer.typography.fontSize")}</GroupLabel>
          <SliderField
            label={t("templateCustomizer.typography.titleSize")}
            value={parseCssPixelValue(working.designTokens.typography.fontSize.lg)}
            min={8}
            max={20}
            step={1}
            display={working.designTokens.typography.fontSize.lg}
            onChange={(v) =>
              updateTypography({
                fontSize: { ...working.designTokens.typography.fontSize, lg: `${v}px` },
              })
            }
          />
          <SliderField
            label={t("templateCustomizer.typography.bodySize")}
            value={parseCssPixelValue(working.designTokens.typography.fontSize.sm)}
            min={8}
            max={16}
            step={1}
            display={working.designTokens.typography.fontSize.sm}
            onChange={(v) =>
              updateTypography({
                fontSize: { ...working.designTokens.typography.fontSize, sm: `${v}px` },
              })
            }
          />
          <SliderField
            label={t("templateCustomizer.layout.lineHeight")}
            value={working.designTokens.typography.lineHeight ?? 1.5}
            min={1}
            max={2}
            step={0.1}
            display={String(working.designTokens.typography.lineHeight ?? 1.5)}
            onChange={(v) => updateTypography({ lineHeight: v })}
          />
          <SliderField
            label={t("templateCustomizer.layout.letterSpacing")}
            value={parseFloat(working.designTokens.typography.letterSpacing ?? "0")}
            min={-1}
            max={3}
            step={0.5}
            display={working.designTokens.typography.letterSpacing ?? "0px"}
            onChange={(v) => updateTypography({ letterSpacing: `${v}px` })}
          />
        </div>
      </AccordionSection>

      {/* Colors */}
      <AccordionSection
        sectionId="colors"
        icon={<Palette size={16} />}
        title={t("templateCustomizer.sections.colors")}
        open={open.colors}
        onToggle={() => toggleSection("colors")}
        registerRef={(el) => (sectionRefs.current.colors = el)}
      >
        <div className="space-y-2.5">
          <GroupLabel>{t("templateCustomizer.colors.quickThemes")}</GroupLabel>
          <ThemeSwatches
            themes={COLOR_THEMES.map((th) => ({ id: th.id, from: th.from, to: th.to }))}
            active={COLOR_THEMES.find(
              (th) => th.colors.primary.toLowerCase() === working.designTokens.colors.primary.toLowerCase(),
            )?.id}
            onPick={(id) => {
              const theme = COLOR_THEMES.find((th) => th.id === id);
              if (theme) updateColors(theme.colors);
            }}
          />
        </div>

        <div className="space-y-5 pt-1">
          <GroupLabel>{t("templateCustomizer.colors.customColors")}</GroupLabel>
          <ColorField
            label={t("templateCustomizer.colors.primary")}
            value={working.designTokens.colors.primary}
            onChange={(c) => updateColors({ primary: c })}
            presets={PANEL_PRESET_COLORS}
          />
          <ColorField
            label={t("templateCustomizer.colors.text")}
            value={working.designTokens.colors.text}
            onChange={(c) => updateColors({ text: c })}
            presets={PANEL_PRESET_COLORS}
          />
          <ColorField
            label={t("templateCustomizer.colors.textSecondary")}
            value={working.designTokens.colors.textSecondary}
            onChange={(c) => updateColors({ textSecondary: c })}
            presets={PANEL_PRESET_COLORS}
          />
          {working.designTokens.colors.sidebar && (
            <ColorField
              label={t("templateCustomizer.colors.sidebar")}
              value={working.designTokens.colors.sidebar}
              onChange={(c) => updateColors({ sidebar: c })}
              presets={PANEL_PRESET_COLORS}
            />
          )}
        </div>

        {/* 高级:边框 / 背景色。默认收起,保持核心配色区干净(仅 3 色)。 */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedColors((v) => !v)}
            className="flex w-full items-center justify-between text-[12px] font-medium text-neutral-400 transition-colors duration-150 hover:text-neutral-200"
          >
            {t("templateCustomizer.colors.advanced")}
            <ChevronRight
              size={13}
              className={cn("transition-transform duration-150", showAdvancedColors && "rotate-90")}
            />
          </button>
          {showAdvancedColors && (
            <div className="space-y-5 pt-4">
              <ColorField
                label={t("templateCustomizer.colors.border")}
                value={working.designTokens.colors.border}
                onChange={(c) => updateColors({ border: c })}
                presets={PANEL_PRESET_COLORS}
              />
              <ColorField
                label={t("templateCustomizer.colors.background")}
                value={working.designTokens.colors.background}
                onChange={(c) => updateColors({ background: c })}
                presets={PANEL_PRESET_COLORS}
              />
            </div>
          )}
        </div>
      </AccordionSection>
    </>
  );

  const panelBody = (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 scrollbar-hide"
    >
      {sectionsContent}

      {hasCustomizations && (
        <button
          type="button"
          onClick={resetCustomizations}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-[12.5px] font-medium text-neutral-400 transition-colors duration-150 hover:border-white/20 hover:text-neutral-200"
        >
          <RotateCcw size={13} />
          {t("templateCustomizer.buttons.reset")}
        </button>
      )}
    </div>
  );

  const modal = (
    <TemplateStoreModal
      open={storeOpen}
      onOpenChange={setStoreOpen}
      templates={templates}
      currentTemplateId={currentTemplateId}
      onSelect={onSelectTemplate}
    />
  );

  // 移动端:抽屉内嵌,无固定定位 / 无图标轨
  if (embedded) {
    return (
      <div className="flex h-full w-full flex-col bg-desk">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4">
          <Shapes size={16} className="text-sky-300" />
          <h2 className="text-[15px] font-semibold tracking-tight text-white">
            {t("templatePanel.customizeTitle")}
          </h2>
        </div>
        {panelBody}
        {modal}
      </div>
    );
  }

  return (
    <>
      <aside className="fixed top-0 right-0 z-40 flex h-screen">
        <motion.div
          className="h-full overflow-hidden border-l border-white/[0.06] bg-desk"
          animate={{ width: rightCollapsed ? 0 : PANEL_WIDTH }}
          initial={false}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <div style={{ width: PANEL_WIDTH }} className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <h2 className="text-[15px] font-semibold tracking-tight text-white">
                {t("templatePanel.customizeTitle")}
              </h2>
            </div>
            {panelBody}
          </div>
        </motion.div>

        {/* 图标轨:折叠开关 + 分区跳转 */}
        <div
          className="flex h-full flex-col items-center gap-1 border-l border-white/[0.06] bg-desk py-3"
          style={{ width: RAIL_WIDTH }}
        >
          <RailButton
            label={rightCollapsed ? t("common.expand") : t("common.collapse")}
            active={false}
            onClick={() => setRightCollapsed(!rightCollapsed)}
          >
            <PanelRight size={18} />
          </RailButton>

          <div className="my-1.5 h-px w-6 bg-white/[0.08]" />

          {railItems.map((item) => (
            <RailButton
              key={item.id}
              label={item.label}
              active={!rightCollapsed && active === item.id}
              onClick={() => jumpTo(item.id)}
            >
              {item.icon}
            </RailButton>
          ))}
        </div>
      </aside>

      {modal}
    </>
  );
}

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
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
        "group relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150",
        active ? "bg-sky-400/10 text-sky-300" : "text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200",
      )}
    >
      {children}
      {active && (
        <span className="absolute -right-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-sky-400" />
      )}
      <span className="pointer-events-none absolute right-11 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

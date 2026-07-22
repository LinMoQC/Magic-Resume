import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, Download, FileJson, Share2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSettingStore } from "@/store/useSettingStore";
import { exportResumeToPdf, preloadResumePdfExport } from "@/lib/utils/pdf-export";
import { Resume } from "@/types/frontend/resume";

type EditorDockProps = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetTransform: (step?: number) => void;
  resume: Resume;
  onShareClick?: () => void;
  onJsonClick: () => void;
};

type DockEntry =
  | { type: "divider"; id: string }
  | { type?: "item"; id: string; title: string; icon: ReactNode; onClick?: () => void; disabled?: boolean };

/**
 * 桌面端底部居中工具坞(参考 Reactive Resume):画布缩放 + 文档导出类高频动作。
 * 透明磨砂条,图标静止安静(neutral-400),hover/触摸时仅做 transform 上浮 + 点亮 sky——
 * 纯合成层动画,无 width/height 抖动,顺滑不卡。放在预览 section 内(relative),
 * `absolute … left-1/2` 自动避开右侧模板栏。
 */
export function EditorDock({ zoomIn, zoomOut, resetTransform, resume, onShareClick, onJsonClick }: EditorDockProps) {
  const { t, i18n } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const cloudSync = useSettingStore((state) => state.cloudSync);
  // Match the locale the preview renders with so the export reuses its cached blob.
  const pdfLocale = i18n.resolvedLanguage || i18n.language;

  const warmupPdfExport = () => {
    // Lightweight: only warms the template + fonts. The full blob is produced
    // (and cached) by the live preview, so the click-to-export stays instant.
    void preloadResumePdfExport(resume).catch(() => {
      // Best-effort warmup only; export handles real failures.
    });
  };

  const handleExportPdf = async () => {
    // 客户端用 @react-pdf/renderer 生成矢量、文字可选中(ATS 友好)的多页 A4 PDF。
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading(t("tools.exportingPDF"));
    try {
      await exportResumeToPdf(resume, pdfLocale);
      toast.success(t("tools.exportPDFSuccess"), { id: toastId });
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error(t("tools.exportPDFError"), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const items: DockEntry[] = useMemo(() => {
    const list: DockEntry[] = [
      { id: "zoom-out", title: t("tools.zoomOut"), icon: <ZoomOut size={16} />, onClick: () => zoomOut() },
      { id: "zoom-reset", title: t("tools.resetZoom"), icon: <RotateCcw size={16} />, onClick: () => resetTransform() },
      { id: "zoom-in", title: t("tools.zoomIn"), icon: <ZoomIn size={16} />, onClick: () => zoomIn() },
      { type: "divider", id: "divider-1" },
      {
        id: "export-pdf",
        title: isExporting ? t("tools.exportingPDF") : t("tools.exportPDF"),
        icon: isExporting ? <Loader2 size={16} className="animate-spin text-sky-300" /> : <Download size={16} />,
        onClick: handleExportPdf,
        disabled: isExporting,
      },
      { id: "view-json", title: t("resumeContent.viewJson"), icon: <FileJson size={16} />, onClick: onJsonClick },
    ];
    if (cloudSync) {
      list.push({ id: "share", title: t("tools.share"), icon: <Share2 size={16} />, onClick: onShareClick });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, isExporting, cloudSync, onShareClick, onJsonClick]);

  return (
    // 居中 translate 留在静态外层(framer 会覆写 transform,不能同元素混用)。
    // 入场与悬停分离:中层 tween 负责登台 —— 与舞台入场同曲线、略滞后半拍,读作"工作台
    // 就位后工具坞浮上来";内层 spring 只管 hover 上浮。旧版把 y:24 弹簧弹入直接放在
    // 胶囊上,面板异步挂载时它会在空黑画布上独自弹出,正是"工具栏出现不优雅"的来源。
    <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      >
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, mass: 0.9 }}
          className="flex items-center gap-0.5 rounded-full border border-white/10 bg-neutral-900/70 px-1.5 py-1 shadow-xl shadow-black/40 backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-200 hover:border-sky-400/30 hover:bg-neutral-900/85 hover:shadow-2xl hover:shadow-black/50"
        >
          {items.map((item) =>
            item.type === "divider" ? (
              <div key={item.id} className="mx-1 h-4 w-px bg-white/10" />
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                onFocus={item.id === "export-pdf" ? warmupPdfExport : undefined}
                onPointerEnter={item.id === "export-pdf" ? warmupPdfExport : undefined}
                disabled={item.disabled}
                title={item.title}
                aria-label={item.title}
                className="group/dock relative flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 transition-colors duration-150 ease-out hover:bg-white/[0.06] hover:text-sky-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {item.icon}
                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-100 opacity-0 transition-opacity duration-150 group-hover/dock:opacity-100">
                  {item.title}
                </span>
              </button>
            ),
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

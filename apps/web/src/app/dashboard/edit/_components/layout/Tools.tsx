import { cn } from "@/lib/utils";
import { Resume } from '@/types/frontend/resume';
import { DownloadIcon } from "@radix-ui/react-icons";
import { Bot, History, Share2, MessageCircle, ChevronDown, ChevronUp, Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type ReactNode, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useSettingStore } from "@/store/useSettingStore";
import { isCloudMode } from "@/lib/config/app";
import { exportResumeToPdf, prepareResumePdfExport } from "@/lib/utils/pdf-export";

export type ToolsProps = {
  isMobile: boolean;
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetTransform: (step?: number) => void;
  resume: Resume;
  onShowAI: () => void;
  onVersionClick?: () => void;
  rightCollapsed?: boolean;
  onShareClick?: () => void;
  onFeedbackClick?: () => void;
};

type ToolButtonProps = {
  title: string;
  children: ReactNode;
  onClick?: () => void;
  onFocus?: () => void;
  onPointerEnter?: () => void;
  disabled?: boolean;
};

const toolButtonClassName =
  "w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition disabled:opacity-60 disabled:cursor-not-allowed";

function ToolButton({ title, children, onClick, onFocus, onPointerEnter, disabled = false }: ToolButtonProps) {
  return (
    <button
      className={toolButtonClassName}
      onClick={onClick}
      onFocus={onFocus}
      onPointerEnter={onPointerEnter}
      disabled={disabled}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

export function Tools({ isMobile, zoomIn, zoomOut, resetTransform, resume, onShowAI, onVersionClick, rightCollapsed = false, onShareClick, onFeedbackClick }: ToolsProps){
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useParams();
  // We can fallback to 'default' or handle error if id is missing, but it should be present in this context
  const currentId = (params?.id as string) || resume.id;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cloudSync = useSettingStore((state) => state.cloudSync);
  
  // 计算桌面端工具栏的right位置，避免被模板栏遮挡
  const desktopRightPosition = rightCollapsed ? '76px' : '300px'; // 56px模板栏 + 20px间距 或 280px模板栏 + 20px间距
  
  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);

  const warmupPdfExport = () => {
    void prepareResumePdfExport(resume, i18n.language).catch(() => {
      // Best-effort warmup only; export handles real failures.
    });
  };

  const handleExportPdf = async () => {
    // 客户端用 @react-pdf/renderer 生成矢量、文字可选中(ATS 友好)的多页 A4 PDF,
    // 一键下载、无打印框。同一份文档在浏览器与服务端产出一致。
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading(t('tools.exportingPDF'));
    try {
      await exportResumeToPdf(resume, i18n.language);
      toast.success(t('tools.exportPDFSuccess'), { id: toastId });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(t('tools.exportPDFError'), { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      className={cn(
        "z-20 flex gap-2 overflow-hidden",
        isMobile
          ? "fixed bottom-6 left-1/2 -translate-x-1/2 flex-row p-2 rounded-full bg-neutral-900/70 border border-neutral-700 backdrop-blur-sm"
          : "fixed bottom-10 flex-col transition-all duration-300"
      )}
      style={!isMobile ? { right: desktopRightPosition } : undefined}
    >

      <div
        className={cn(
          "flex gap-2 transition-all duration-300 ease-out",
          isMobile ? "flex-row" : "flex-col",
          isCollapsed && !isMobile ? "max-h-0 opacity-0 scale-95 pointer-events-none" : "max-h-[520px] opacity-100 scale-100"
        )}
      >
        <>
          {!isMobile && isCloudMode && (
            <ToolButton
              title={t('tools.aiAssistant')}
              onClick={onShowAI}
            >
              <Bot size={18}/>
            </ToolButton>
          )}
          
          {cloudSync && (
            <ToolButton
              title={t('tools.share', 'Share')}
              onClick={onShareClick}
            >
              <Share2 size={18}/>
            </ToolButton>
          )}

          {isCloudMode && (
            <ToolButton
              onClick={() => {
                  if (onFeedbackClick) {
                      onFeedbackClick();
                  } else if (currentId) {
                      // Fallback to internal navigation if prop is not provided, though it should be.
                      router.push('/dashboard/edit/' + currentId + '/feedback');
                  }
              }}
              title={t('tools.feedback', 'Feedback')}
            >
              <MessageCircle size={18}/>
            </ToolButton>
          )}

          {cloudSync && !isMobile && (
            <ToolButton
              onClick={onVersionClick}
              title={t('header.versionHistory')}
            >
              <History size={18}/>
            </ToolButton>
          )}
          <ToolButton
            onClick={handleExportPdf}
            disabled={isExporting}
            title={isExporting ? t('tools.exportingPDF') : t('tools.exportPDF')}
            onFocus={warmupPdfExport}
            onPointerEnter={warmupPdfExport}
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <DownloadIcon />}
          </ToolButton>
          <ToolButton
            onClick={() => zoomIn()}
            title={t('tools.zoomIn')}
          >
            <ZoomIn size={18} />
          </ToolButton>
          <ToolButton
            onClick={() => zoomOut()}
            title={t('tools.zoomOut')}
          >
            <ZoomOut size={18} />
          </ToolButton>
          <ToolButton
            onClick={() => resetTransform()}
            title={t('tools.resetZoom')}
          >
            <RotateCcw size={18} />
          </ToolButton>
        </>
      </div>

      {!isMobile && (
        <ToolButton
          onClick={toggleCollapsed}
          title={isCollapsed ? t('tools.expand', 'Expand') : t('tools.collapse', 'Collapse')}
        >
          {isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </ToolButton>
      )}
    </div>
  )
}

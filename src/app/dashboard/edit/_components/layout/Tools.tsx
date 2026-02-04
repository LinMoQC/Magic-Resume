import { cn } from "@/lib/utils";
import { exportOriginalStyle } from '@/lib/utils/puppeteer-export';
import { InfoType, CustomTemplateConfig } from '@/types/frontend/resume';
import { DownloadIcon } from "@radix-ui/react-icons";
import { Bot, History, Share2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSettingStore } from "@/store/useSettingStore";

export type ToolsProps = {
  isMobile: boolean;
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetTransform: (step?: number) => void;
  info: InfoType;
  onShowAI: () => void;
  onVersionClick?: () => void;
  rightCollapsed?: boolean;
  templateId?: string;
  customTemplate?: CustomTemplateConfig;
  onShareClick?: () => void;
  onFeedbackClick?: () => void;
};

export function Tools({ isMobile, zoomIn, zoomOut, resetTransform, info, onShowAI, onVersionClick, rightCollapsed = false, templateId, customTemplate, onShareClick, onFeedbackClick }: ToolsProps){
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  // We can fallback to 'default' or handle error if id is missing, but it should be present in this context
  const currentId = (params?.id as string) || templateId;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const cloudSync = useSettingStore((state) => state.cloudSync);
  
  // 计算桌面端工具栏的right位置，避免被模板栏遮挡
  const desktopRightPosition = rightCollapsed ? '76px' : '300px'; // 56px模板栏 + 20px间距 或 280px模板栏 + 20px间距
  
  const toggleCollapsed = () => setIsCollapsed((prev) => !prev);

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
          {!isMobile && (
            <button
              className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
              title={t('tools.aiAssistant')}
              type="button"
              onClick={onShowAI}
            >
              <Bot size={18}/>
            </button>
          )}
          
          {cloudSync && (
            <button
              className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
              title={t('tools.share', 'Share')}
              type="button"
              onClick={onShareClick}
            >
              <Share2 size={18}/>
            </button>
          )}

          <button
            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
            onClick={() => {
                if (onFeedbackClick) {
                    onFeedbackClick();
                } else if (currentId) {
                    // Fallback to internal navigation if prop is not provided, though it should be.
                    router.push('/dashboard/edit/' + currentId + '/feedback');
                }
            }}
            title={t('tools.feedback', 'Feedback')}
            type="button"
          >
            <MessageCircle size={18}/>
          </button>

          {cloudSync && !isMobile && (
            <button
              className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
              onClick={onVersionClick}
              title={t('header.versionHistory')}
              type="button"
            >
              <History size={18}/>
            </button>
          )}
          <button
            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
            onClick={() => exportOriginalStyle(info, templateId, customTemplate)}
            title={t('tools.exportPDF')}
            type="button"
          >
            <DownloadIcon />
          </button>
          <button
            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
            onClick={() => zoomIn()}
            title={t('tools.zoomIn')}
            type="button"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <button
            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
            onClick={() => zoomOut()}
            title={t('tools.zoomOut')}
            type="button"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <button
            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
            onClick={() => resetTransform()}
            title={t('tools.resetZoom')}
            type="button"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" /></svg>
          </button>
        </>
      </div>

      {!isMobile && (
        <button
          className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
          onClick={toggleCollapsed}
          title={isCollapsed ? t('tools.expand', 'Expand') : t('tools.collapse', 'Collapse')}
          type="button"
        >
          {isCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      )}
    </div>
  )
}

import { cn } from "@/lib/utils";
import { exportOriginalStyle } from "@/lib/puppeteer-export";
import { InfoType } from "@/store/useResumeStore";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ToolsProps = {
  isMobile: boolean;
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetTransform: (step?: number) => void;
  info: InfoType;
  onShowAI: () => void;
  rightCollapsed?: boolean; 
};

export function Tools({ isMobile, zoomIn, zoomOut, resetTransform, info, onShowAI, rightCollapsed = false }: ToolsProps){
  const { t } = useTranslation();
  
  // 计算桌面端工具栏的right位置，避免被模板栏遮挡
  const desktopRightPosition = rightCollapsed ? '76px' : '300px'; // 56px模板栏 + 20px间距 或 280px模板栏 + 20px间距
  
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

      {!isMobile && (
        <>
          <button
            className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
            title={t('tools.aiAssistant')}
            type="button"
            onClick={onShowAI}
          >
            <Bot size={18}/>
          </button>
        </>
      )}
      
      <button
        className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
        onClick={() => exportOriginalStyle(info)}
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
    </div>
  )
}
import { cn } from "@/lib/utils";
import { exportOriginalStyle } from "@/lib/puppeteer-export";
import { InfoType, CustomTemplateConfig } from "@/store/useResumeStore";
import { DownloadIcon } from "@radix-ui/react-icons";
import { Bot, History as HistoryIcon, Bug, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettingStore } from "@/store/useSettingStore";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
};

export function Tools({ isMobile, zoomIn, zoomOut, resetTransform, info, onShowAI, onVersionClick, rightCollapsed = false, templateId, customTemplate }: ToolsProps){
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  
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

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.95 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-2 overflow-hidden origin-bottom"
          >
            <>
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
                  
                  <button
                    className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-red-400 hover:bg-neutral-700 transition"
                    onClick={() => window.open("https://github.com/LinMoQC/Magic-Resume/issues", "_blank")}
                    title={t('tools.bugReport')}
                    type="button"
                  >
                    <Bug size={18}/>
                  </button>
                </>
              )}
              
              {useSettingStore.getState().cloudSync && (
                <button
                  className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
                  onClick={onVersionClick}
                  title={t('header.versionHistory')}
                  type="button"
                >
                  <HistoryIcon size={18}/>
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
          </motion.div>
        )}
      </AnimatePresence>

      {!isMobile && (
        <button
          className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition-all duration-300"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? t('common.ui.hide') : t('common.ui.view')}
          type="button"
        >
          <motion.div
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={18}/>
          </motion.div>
        </button>
      )}
    </div>
  )
}
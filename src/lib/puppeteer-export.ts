import { toast } from "sonner";
import { InfoType, CustomTemplateConfig } from "@/store/useResumeStore";
import i18n from '@/i18n';
import { getMagicTemplateById, getDefaultMagicTemplate } from '@/templates/config/magic-templates';
import { mergeTemplateConfig } from '@/lib/templateUtils';

// 原样式导出（保持与预览一致，支持单页无限延长）
export async function exportOriginalStyle(info: InfoType, templateId?: string, customTemplate?: CustomTemplateConfig) {
  const resumeElement = document.getElementById('resume-to-export');
  if (!resumeElement) {
    toast.error(i18n.t('export.notifications.elementNotFound'));
    return;
  }

  try {
    // 获取完整的HTML内容
    const clonedElement = resumeElement.cloneNode(true) as HTMLElement;
    
    // 获取所有样式表
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          console.warn('Cannot access stylesheet:', e);
          return '';
        }
      })
      .join('\n');
      
    // 获取正确的模板颜色配置
    let colorPrimary = '#3b82f6';
    let colorText = '#1f2937';
    let colorTextSecondary = '#6b7280';
    let colorBackground = '#ffffff';
    let colorSidebar = null;
    
    try {
      // 如果提供了模板配置，则使用模板配置中的颜色
      if (templateId || customTemplate) {
        let baseTemplate;
        if (templateId) {
          try {
            baseTemplate = await getMagicTemplateById(templateId);
          } catch {
            baseTemplate = await getDefaultMagicTemplate();
          }
        } else {
          baseTemplate = await getDefaultMagicTemplate();
        }
        
        // 合并自定义配置
        const finalTemplate = mergeTemplateConfig(baseTemplate, customTemplate);
        colorPrimary = finalTemplate.designTokens.colors.primary;
        colorText = finalTemplate.designTokens.colors.text;
        colorTextSecondary = finalTemplate.designTokens.colors.textSecondary;
        colorBackground = finalTemplate.designTokens.colors.background;
        if (finalTemplate.designTokens.colors.sidebar) {
          colorSidebar = finalTemplate.designTokens.colors.sidebar;
        }
      } else {
        // 回退到从DOM获取CSS变量值
        const rootElement = document.documentElement;
        const computedStyle = getComputedStyle(rootElement);
        colorPrimary = computedStyle.getPropertyValue('--color-primary').trim() || colorPrimary;
        colorText = computedStyle.getPropertyValue('--color-text').trim() || colorText;
        colorTextSecondary = computedStyle.getPropertyValue('--color-text-secondary').trim() || colorTextSecondary;
        colorBackground = computedStyle.getPropertyValue('--color-background').trim() || colorBackground;
        const sidebarColor = computedStyle.getPropertyValue('--color-sidebar').trim();
        if (sidebarColor) {
          colorSidebar = sidebarColor;
        }
      }
    } catch (error) {
      console.warn('Failed to get template colors, using defaults:', error);
    }

    // 构建完整的HTML文档（支持单页无限延长）
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>简历 - ${info.fullName || 'Resume'}</title>
          <style>
            ${styles}
            
            /* Timeline组件CSS变量定义 - 使用实际模板颜色 */
            :root {
              --color-text: ${colorText};
              --color-primary: ${colorPrimary};
              --color-text-secondary: ${colorTextSecondary};
              --color-background: ${colorBackground};
              ${colorSidebar ? `--color-sidebar: ${colorSidebar};` : ''}
              --line-height: 1.6;
              --letter-spacing: normal;
              --section-spacing: 2rem;
              --paragraph-spacing: 1rem;
            }
            
            /* Timeline组件完整Tailwind CSS样式补充 */
            /* 布局样式 */
            .relative { position: relative !important; }
            .absolute { position: absolute !important; }
            .flex { display: flex !important; }
            .flex-col { flex-direction: column !important; }
            .flex-row { flex-direction: row !important; }
            .space-y-6 > * + * { margin-top: 1.5rem !important; }
            
            /* 定位和尺寸 */
            .left-0 { left: 0px !important; }
            .top-2 { top: 0.5rem !important; }
            .top-6 { top: 1.5rem !important; }
            .w-3 { width: 0.75rem !important; }
            .h-3 { height: 0.75rem !important; }
            .w-0\.5 { width: 0.125rem !important; }
            .h-full { height: 100% !important; }
            .pl-6 { padding-left: 1.5rem !important; }
            .pb-2 { padding-bottom: 0.5rem !important; }
            .mt-1 { margin-top: 0.25rem !important; }
            
                         /* 颜色和背景 */
             .bg-blue-500 { background-color: ${colorPrimary} !important; }
             .bg-gray-200 { background-color: #e5e7eb !important; }
             .border-white { border-color: #ffffff !important; }
             .text-primary { color: ${colorPrimary} !important; }
            
            /* 边框和阴影 */
            .rounded-full { border-radius: 9999px !important; }
            .border-2 { border-width: 2px !important; }
            .shadow-md { 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                          0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; 
            }
            
            /* 字体样式 */
            .font-bold { font-weight: 700 !important; }
            .font-medium { font-weight: 500 !important; }
            .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
            .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
            .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
            
            /* Timeline特殊类名修复 - Tailwind left-[5px] */
            [class*="left-"][class*="5px"],
            .absolute.left-\[5px\] {
              left: 5px !important;
            }
            
            /* 直接匹配Timeline线条元素 */
            .absolute.top-6.w-0\.5.h-full.bg-gray-200,
            .absolute[class*="top-6"][class*="w-0"][class*="h-full"][class*="bg-gray-200"] {
              position: absolute !important;
              left: 5px !important;
              top: 1.5rem !important;
              width: 0.125rem !important;
              height: 100% !important;
              background-color: #e5e7eb !important;
            }
            
                         /* 更多Tailwind CSS类名支持 */
             .justify-between { justify-content: space-between !important; }
             .items-start { align-items: flex-start !important; }
             .items-center { align-items: center !important; }
             .space-y-4 > * + * { margin-top: 1rem !important; }
             .space-y-2 > * + * { margin-top: 0.5rem !important; }
             .mb-2 { margin-bottom: 0.5rem !important; }
             .mb-4 { margin-bottom: 1rem !important; }
             .p-4 { padding: 1rem !important; }
             .p-2 { padding: 0.5rem !important; }
             .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
             .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
             .border { border-width: 1px !important; }
             .border-gray-200 { border-color: #e5e7eb !important; }
             .rounded { border-radius: 0.25rem !important; }
             .rounded-lg { border-radius: 0.5rem !important; }
             .bg-white { background-color: ${colorBackground} !important; }
             .bg-gray-50 { background-color: #f9fafb !important; }
             .bg-gray-100 { background-color: #f3f4f6 !important; }
             ${colorSidebar ? `.sidebar, [data-area="sidebar"] { background-color: ${colorSidebar} !important; }` : ''}
             .text-gray-600 { color: #4b5563 !important; }
             .text-gray-700 { color: #374151 !important; }
             .text-gray-800 { color: ${colorText} !important; }
             .text-gray-900 { color: ${colorText} !important; }
             .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
             .leading-relaxed { line-height: 1.625 !important; }
             .leading-normal { line-height: 1.5 !important; }
             .text-center { text-align: center !important; }
             .text-left { text-align: left !important; }
             .text-right { text-align: right !important; }
             .w-full { width: 100% !important; }
             .h-auto { height: auto !important; }
             .block { display: block !important; }
             .inline { display: inline !important; }
             .inline-block { display: inline-block !important; }
             .hidden { display: none !important; }
             .overflow-hidden { overflow: hidden !important; }
             .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
             
             /* 响应式样式支持 */
             @media (min-width: 640px) {
               .sm\:flex-row { flex-direction: row !important; }
               .sm\:justify-between { justify-content: space-between !important; }
               .sm\:items-start { align-items: flex-start !important; }
               .sm\:mt-0 { margin-top: 0px !important; }
               .sm\:text-left { text-align: left !important; }
               .sm\:text-right { text-align: right !important; }
               .sm\:block { display: block !important; }
               .sm\:hidden { display: none !important; }
             }
             
             @media (min-width: 768px) {
               .md\:flex-row { flex-direction: row !important; }
               .md\:justify-between { justify-content: space-between !important; }
               .md\:items-start { align-items: flex-start !important; }
               .md\:text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
               .md\:text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
             }
            
                         /* Timeline圆点样式确保 */
             .timeline-dot {
               position: absolute !important;
               left: 0px !important;
               top: 0.5rem !important;
               width: 0.75rem !important;
               height: 0.75rem !important;
               background-color: ${colorPrimary} !important;
               border-radius: 9999px !important;
               border: 2px solid #ffffff !important;
               box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                           0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
             }
            
            /* Timeline线条样式确保 */
            .timeline-line {
              position: absolute !important;
              left: 5px !important;
              top: 1.5rem !important;
              width: 0.125rem !important;
              height: 100% !important;
              background-color: #e5e7eb !important;
            }
            
            /* 单页无限延长核心样式 - 完全禁用分页 */
            @page {
              size: auto;
              margin: 0;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-before: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
              background: white;
              overflow: visible !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
            }
            
            /* 确保简历容器完全禁用分页 */
            #resume-to-export {
              background: white;
              box-shadow: none !important;
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 10px;
              box-sizing: border-box;
              min-height: auto !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-before: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
            }
            
            /* 确保所有子元素不被分页截断 */
            #resume-to-export * {
              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-before: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
            }
            
            /* 特别处理关键元素 */
            section, .section, div[class*="section"],
            h1, h2, h3, h4, h5, h6,
            p, li, div, span,
            ul, ol, table, tr, td, th {
              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-before: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
            }
            
            /* 禁用浏览器默认的打印分页 */
            @media print {
              html, body {
                height: auto !important;
                overflow: visible !important;
              }
              
              #resume-to-export {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          </style>
        </head>
        <body>
          ${clonedElement.outerHTML}
        </body>
      </html>
    `;

    toast.info(i18n.t('export.notifications.generating'));

    // 发送到后端API，启用单页无限延长模式
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: fullHTML,
        options: {
          printBackground: true,
          // 移除format限制，让后端根据内容动态计算高度
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || i18n.t('export.notifications.pdfGenerationFailed'));
    }

    // 下载PDF
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${info.fullName || 'resume'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(i18n.t('export.notifications.success'));

  } catch (error) {
    console.error('单页无限延长导出失败:', error);
    toast.error(`${i18n.t('export.notifications.error')}: ${error instanceof Error ? error.message : i18n.t('export.notifications.unknownError')}`);
  }
}

 
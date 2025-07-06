import { toast } from "sonner";
import { InfoType } from "@/store/useResumeStore";
import i18n from '@/i18n';

// 原样式导出（保持与预览一致，支持单页无限延长）
export async function exportOriginalStyle(info: InfoType) {
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
              max-width: 100vw;
              margin: 0;
              padding: 0; /* 移除内边距，避免影响尺寸计算 */
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

    // 获取简历元素的实际宽度和高度
    const resumeRect = resumeElement.getBoundingClientRect();
    const resumeWidth = Math.round(resumeRect.width) || 794; 
    const resumeHeight = Math.max(resumeElement.scrollHeight, resumeElement.offsetHeight, resumeRect.height);
    
    console.log('前端简历尺寸:', {
      宽度: resumeWidth,
      高度: resumeHeight,
      scrollHeight: resumeElement.scrollHeight,
      offsetHeight: resumeElement.offsetHeight,
      rectHeight: resumeRect.height
    });

    toast.info(i18n.t('export.notifications.generating'));

    // 发送到后端API，启用单页无限延长模式
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: fullHTML,
        width: resumeWidth, // 传入动态宽度
        height: resumeHeight,
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

 
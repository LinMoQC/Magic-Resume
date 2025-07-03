import { toast } from "sonner";
import { InfoType } from "@/store/useResumeStore";

// 原样式导出（保持与预览一致，支持单页无限延长）
export async function exportOriginalStyle(info: InfoType) {
  const resumeElement = document.getElementById('resume-to-export');
  console.log('resume', info);
  if (!resumeElement) {
    toast.error('找不到简历元素');
    return;
  }

  try {
    toast.info('正在准备单页无限延长导出...');

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

    console.log('前端调试 - 克隆元素内容长度:', clonedElement.innerHTML.length);
    console.log('前端调试 - 构建的HTML长度:', fullHTML.length);
    console.log('前端调试 - 简历信息:', info);
    console.log('前端调试 - body内容预览:', clonedElement.outerHTML.substring(0, 300) + '...');

    toast.info('正在生成单页无限延长PDF...');

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
      throw new Error(errorData.details || 'PDF生成失败');
    }

    // 下载PDF
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${info.fullName || 'resume'}-unlimited.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('单页无限延长PDF导出成功！');

  } catch (error) {
    console.error('单页无限延长导出失败:', error);
    toast.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

 
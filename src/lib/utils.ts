import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { MagicDebugger } from "./debuggger";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { InfoType } from "@/store/useResumeStore";
import jsPDF from "jspdf";
import i18n from "@/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 时间格式化
export function formatTime(ts: number) {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const diffSeconds = Math.floor(diff / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
} 

// 简历快照
export function generateSnapshot(): Promise<Blob | null> {
  return new Promise(async (resolve) => {
    const element = document.getElementById('resume-to-export');
    if (!element) {
      MagicDebugger.error("Snapshot failed: Preview element not found.");
      resolve(null);
      return;
    }
    
    const clonedResume = element.cloneNode(true) as HTMLElement;
    clonedResume.style.width = `${element.offsetWidth}px`;
    clonedResume.style.position = 'absolute';
    clonedResume.style.left = '-9999px';
    clonedResume.style.top = '0px';
    document.body.appendChild(clonedResume);

    const elements = [clonedResume, ...Array.from(clonedResume.getElementsByTagName('*')) as HTMLElement[]];
    
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const colorProps = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
      const oklchRegex = /oklch\(([^)]+)\)/;
      
      colorProps.forEach(prop => {
        const value = style.getPropertyValue(prop);
        const match = value.match(oklchRegex);
        if (match) {
          try {
            const [l, c, h] = match[1].split(' ').map(s => parseFloat(s.replace('%', '')));
            const [r, g, b] = oklchToRgb(l, c, h);
            el.style.setProperty(prop, `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`, 'important');
          } catch (e) {
            MagicDebugger.warn(`Could not convert oklch color: ${match[0]}`, e);
          }
        }
      });
    });

    try {
      const images = Array.from(clonedResume.getElementsByTagName('img'));
      const imageLoadPromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      });
      await Promise.all(imageLoadPromises);

      const canvas = await html2canvas(clonedResume, {
        scale: 0.5,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        document.body.removeChild(clonedResume);
        resolve(blob);
      }, 'image/jpeg', 0.7);
    } catch (error) {
      document.body.removeChild(clonedResume);
      MagicDebugger.error("Error generating snapshot:", error);
      resolve(null);
    }
  });
};

// 下载简历
export function handleExport(info: InfoType){
  const resumeElement = document.getElementById('resume-to-export');
  if (resumeElement) {
    const originalStyle = resumeElement.style.transform;
    const clonedResume = resumeElement.cloneNode(true) as HTMLElement;
    clonedResume.style.width = `${resumeElement.offsetWidth}px`;
    clonedResume.style.position = 'absolute';
    clonedResume.style.left = '-9999px';
    clonedResume.style.top = '0px';
    document.body.appendChild(clonedResume);
    
    clonedResume.style.transform = '';

    setTimeout(() => {
      const originalElements = [resumeElement, ...Array.from(resumeElement.getElementsByTagName('*')) as HTMLElement[]];
      const clonedElements = [clonedResume, ...Array.from(clonedResume.getElementsByTagName('*')) as HTMLElement[]];
      const oklchRegex = /oklch\([^)]+\)/g;

      for (let i = 0; i < originalElements.length; i++) {
        const originalEl = originalElements[i];
        const clonedEl = clonedElements[i] as HTMLElement;
        const computedStyle = window.getComputedStyle(originalEl);
        
        for (const prop of computedStyle) {
          const rawValue = computedStyle.getPropertyValue(prop);
          const priority = computedStyle.getPropertyPriority(prop);
          let finalValue = rawValue;

          if (rawValue.includes('oklch')) {
            try {
              finalValue = rawValue.replace(oklchRegex, (match) => {
                const oklchContent = match.match(/oklch\(([^)]+)\)/);
                if (!oklchContent) return 'rgb(0,0,0)';

                const [l, c, h] = oklchContent[1].split(' ').map(s => {
                  const num = parseFloat(s.replace('%', ''));
                  return isNaN(num) ? 0 : num;
                });

                const [r, g, b] = oklchToRgb(l, c, h);
                return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
              });
            } catch (e) {
              MagicDebugger.warn(`Could not convert oklch in property "${prop}": "${rawValue}". Skipping this property.`, e);
              continue;
            }
          }

          clonedEl.style.setProperty(prop, finalValue, priority);
        }

        // 修复图标对齐问题
        const tagName = originalEl.tagName.toLowerCase();
        const classNames = originalEl.className ? originalEl.className.toString() : '';
        
        // 处理SVG图标
        if (tagName === 'svg') {
          clonedEl.style.setProperty('vertical-align', 'middle', 'important');
          clonedEl.style.setProperty('margin-top', '2px', 'important');
        }
        
        // 处理React图标 (通过类名识别)
        if (originalEl.getAttribute && originalEl.getAttribute('data-icon')) {
          clonedEl.style.setProperty('vertical-align', 'middle', 'important');
          clonedEl.style.setProperty('margin-top', '2px', 'important');
        }
        
        // 处理FontAwesome图标
        if (classNames.includes('fa-') || classNames.includes('FaIcon')) {
          clonedEl.style.setProperty('vertical-align', 'middle', 'important');
          clonedEl.style.setProperty('margin-top', '2px', 'important');
        }
        
        // 处理Emoji图标 - 通过内容检测emoji字符
        if (tagName === 'span' && originalEl.textContent) {
          const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F020}-\u{1F02F}]/u;
          if (emojiRegex.test(originalEl.textContent)) {
            clonedEl.style.setProperty('vertical-align', 'middle', 'important');
            clonedEl.style.setProperty('line-height', '1', 'important');
            clonedEl.style.setProperty('display', 'inline-block', 'important');
          }
        }
        
        // 处理包含图标的分隔符容器 - 确保flex容器中的items-center正确工作
        if (tagName === 'div' && classNames.includes('flex') && classNames.includes('items-center')) {
          clonedEl.style.setProperty('align-items', 'center', 'important');
          clonedEl.style.setProperty('display', 'flex', 'important');
          
          // 处理gap样式
          if (classNames.includes('gap-x-2')) {
            clonedEl.style.setProperty('column-gap', '0.5rem', 'important');
          }
          if (classNames.includes('gap-x-1.5')) {
            clonedEl.style.setProperty('column-gap', '0.375rem', 'important');
          }
        }
        
        // 处理分隔符边框样式
        if (classNames.includes('border-r') && classNames.includes('pr-2')) {
          clonedEl.style.setProperty('border-right', '1px solid currentColor', 'important');
          clonedEl.style.setProperty('padding-right', '0.5rem', 'important');
        }
      }

      const images = Array.from(clonedResume.getElementsByTagName('img'));
      const imageLoadPromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      });

      Promise.all(imageLoadPromises).then(() => {
        html2canvas(clonedResume, {
          scale: 2,
          useCORS: true,
          logging: true,
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const imgRatio = canvasWidth / canvasHeight;

          const pdfWidth = 210;
          const pdfHeight = pdfWidth / imgRatio;
          
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
          });
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          pdf.save(`${info.fullName || 'resume'}.pdf`);
          toast.success(i18n.t('export.notifications.success'));

        }).catch(error => {
          MagicDebugger.error('Error exporting resume:', error);
          toast.error(i18n.t('export.notifications.error'));
        }).finally(() => {
          document.body.removeChild(clonedResume);
          if (resumeElement) {
            resumeElement.style.transform = originalStyle;
          }
        });
      }).catch(error => {
        MagicDebugger.error('Error loading images for export:', error);
        toast.error(i18n.t('export.notifications.imageError'));
        document.body.removeChild(clonedResume);
        if (resumeElement) {
          resumeElement.style.transform = originalStyle;
        }
      });
    }, 100);
  }
};

// 颜色解析
function oklchToRgb(l: number, c: number, h: number){
  const a = c * Math.cos(h * Math.PI / 180);
  const b = c * Math.sin(h * Math.PI / 180);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  let r = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  let g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  let bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;

  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  bl = Math.max(0, Math.min(1, bl));

  return [r * 255, g * 255, bl * 255];
}

export function formatRelativeTime(date: string) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return targetDate.toLocaleDateString();
}

/**
 * 客户端安全的时间生成函数
 * 在服务器端返回null，在客户端返回实际时间
 * 避免hydration错误
 */
export function getClientSafeTimestamp(): string | null {
  if (typeof window === 'undefined') {
    return null; // 服务器端返回null
  }
  return new Date().toISOString(); // 客户端返回实际时间
}

/**
 * 获取当前年份，客户端安全
 */
export function getClientSafeYear(): number {
  if (typeof window === 'undefined') {
    return 2025; // 服务器端返回默认年份
  }
  return new Date().getFullYear(); // 客户端返回实际年份
}
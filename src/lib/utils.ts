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

          if (originalEl.tagName.toLowerCase() === 'svg') {
            const parent = originalEl.parentElement;
            if (parent && window.getComputedStyle(parent).display === 'flex' && window.getComputedStyle(parent).alignItems === 'center') {
              clonedEl.style.setProperty('overflow', 'visible', 'important');
            }
          }
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
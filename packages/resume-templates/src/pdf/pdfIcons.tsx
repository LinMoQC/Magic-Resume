import React from 'react';
import { Circle, Path, Rect, Svg } from '@react-pdf/renderer';

/**
 * 把预览用的 lucide 图标(章节图标 + 联系方式图标)以矢量 SVG 画进 PDF,
 * 路径数据取自 lucide-react v0.513(24×24 viewBox、描边式)。
 */

type IconEl =
  | { t: 'path'; d: string }
  | { t: 'rect'; x: number; y: number; width: number; height: number; rx?: number }
  | { t: 'circle'; cx: number; cy: number; r: number };

const ICONS: Record<string, IconEl[]> = {
  briefcase: [
    { t: 'path', d: 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
    { t: 'rect', x: 2, y: 6, width: 20, height: 14, rx: 2 },
  ],
  graduationCap: [
    { t: 'path', d: 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z' },
    { t: 'path', d: 'M22 10v6' },
    { t: 'path', d: 'M6 12.5V16a6 3 0 0 0 12 0v-3.5' },
  ],
  folderOpen: [
    { t: 'path', d: 'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2' },
  ],
  wrench: [
    { t: 'path', d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
  ],
  languages: [
    { t: 'path', d: 'm5 8 6 6' }, { t: 'path', d: 'm4 14 6-6 2-3' }, { t: 'path', d: 'M2 5h12' },
    { t: 'path', d: 'M7 2h1' }, { t: 'path', d: 'm22 22-5-10-5 10' }, { t: 'path', d: 'M14 18h6' },
  ],
  award: [
    { t: 'path', d: 'm15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526' },
    { t: 'circle', cx: 12, cy: 8, r: 6 },
  ],
  user: [
    { t: 'path', d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' },
    { t: 'circle', cx: 12, cy: 7, r: 4 },
  ],
  globe: [
    { t: 'circle', cx: 12, cy: 12, r: 10 },
    { t: 'path', d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' },
    { t: 'path', d: 'M2 12h20' },
  ],
  phone: [
    { t: 'path', d: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384' },
  ],
  mail: [
    { t: 'path', d: 'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7' },
    { t: 'rect', x: 2, y: 4, width: 20, height: 16, rx: 2 },
  ],
  mapPin: [
    { t: 'path', d: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' },
    { t: 'circle', cx: 12, cy: 10, r: 3 },
  ],
};

export type PdfIconName = keyof typeof ICONS;

const SECTION_ICON_BY_KEY: Record<string, PdfIconName> = {
  experience: 'briefcase',
  education: 'graduationCap',
  projects: 'folderOpen',
  skills: 'wrench',
  languages: 'languages',
  certificates: 'award',
  profiles: 'user',
  contact: 'globe',
};

export const getSectionPdfIcon = (sectionKey?: string): PdfIconName | null =>
  (sectionKey && SECTION_ICON_BY_KEY[sectionKey]) || null;

export const PdfIcon = ({ name, size, color }: { name: PdfIconName; size: number; color: string }) => {
  const els = ICONS[name];
  if (!els) return null;
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      {els.map((el, index) => {
        if (el.t === 'path') {
          return (
            <Path key={index} d={el.d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          );
        }
        if (el.t === 'rect') {
          return <Rect key={index} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} stroke={color} strokeWidth={2} fill="none" />;
        }
        return <Circle key={index} cx={el.cx} cy={el.cy} r={el.r} stroke={color} strokeWidth={2} fill="none" />;
      })}
    </Svg>
  );
};

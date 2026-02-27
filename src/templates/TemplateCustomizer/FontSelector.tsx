import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
  fonts?: { name: string; value: string; preview: string }[];
}

const defaultFonts = [
  // 系统可用中文字体
  { name: '苹方', value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif', preview: '字Aa' },
  { name: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif', preview: '字Aa' },
  { name: '思源黑体', value: '"Noto Sans CJK SC", "Source Han Sans SC", "PingFang SC", sans-serif', preview: '字Aa' },
  { name: '宋体', value: '"Songti SC", "SimSun", serif', preview: '字Aa' },
  { name: '楷体', value: '"Kaiti SC", "KaiTi", serif', preview: '字Aa' },

  // 系统可用西文字体
  { name: 'Inter', value: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', preview: 'Aa' },
  { name: 'Helvetica', value: '"Helvetica Neue", Helvetica, Arial, sans-serif', preview: 'Aa' },
  { name: 'Arial', value: 'Arial, "Helvetica Neue", sans-serif', preview: 'Aa' },
  { name: 'Georgia', value: 'Georgia, "Times New Roman", serif', preview: 'Aa' },
  { name: 'Times New Roman', value: '"Times New Roman", Georgia, serif', preview: 'Aa' },
  { name: 'Courier New', value: '"Courier New", monospace', preview: 'Aa' },
  { name: 'Menlo', value: 'Menlo, Monaco, "Courier New", monospace', preview: 'Aa' },

  // 常见系统自带无衬线
  { name: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', preview: 'Aa' },
  { name: 'Segoe UI', value: '"Segoe UI", system-ui, sans-serif', preview: 'Aa' },
  { name: 'Roboto', value: 'Roboto, "Helvetica Neue", Arial, sans-serif', preview: 'Aa' },

  // 衬线 + 经典
  { name: 'Palatino', value: '"Palatino Linotype", Palatino, "Book Antiqua", serif', preview: 'Aa' },
  { name: 'IBM Plex Serif', value: '"IBM Plex Serif", Georgia, serif', preview: 'Aa' },
];

export default React.memo(function FontSelector({ label, value, onChange, fonts = defaultFonts }: FontSelectorProps) {
  const selectedFont = fonts.find(font => font.value === value) || fonts[0];

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-neutral-200">{label}</label>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-700">
          <SelectValue>
            <div className="flex items-center gap-3">
              <span 
                className="text-lg"
                style={{ fontFamily: selectedFont.value }}
              >
                {selectedFont.preview}
              </span>
              <span>{selectedFont.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-neutral-800 border-neutral-600 text-white">
          {fonts.map((font) => (
            <SelectItem 
              key={font.value} 
              value={font.value}
              className="hover:bg-neutral-700 focus:bg-neutral-700 text-white"
            >
              <div className="flex items-center gap-3">
                <span 
                  className="text-lg min-w-[24px]"
                  style={{ fontFamily: font.value }}
                >
                  {font.preview}
                </span>
                <span>{font.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

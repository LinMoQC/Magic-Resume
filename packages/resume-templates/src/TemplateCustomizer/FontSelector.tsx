import React from 'react';

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

      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-white">
          <span className="text-lg min-w-6" style={{ fontFamily: selectedFont.value }}>
            {selectedFont.preview}
          </span>
          <span className="text-sm">{selectedFont.name}</span>
        </div>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none transition-colors hover:bg-neutral-700 focus:border-blue-400"
        >
          {fonts.map((font) => (
            <option key={font.value} value={font.value}>
              {font.preview} {font.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

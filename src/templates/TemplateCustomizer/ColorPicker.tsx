import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

const defaultPresetColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#F43F5E', '#8B5A2B', '#374151', '#1F2937'
];

export default function ColorPicker({ label, value, onChange, presetColors = defaultPresetColors }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-200">{label}</label>
      
      <div className="space-y-3">
        {/* 当前颜色和输入框 */}
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg border-2 border-neutral-600 cursor-pointer"
            style={{ backgroundColor: value }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'color';
              input.value = value;
              input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
              input.click();
            }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="#000000"
          />
        </div>

        {/* 预设颜色 */}
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color, index) => (
            <button
              key={index}
              className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                value === color 
                  ? 'border-white scale-110' 
                  : 'border-neutral-600 hover:border-neutral-400 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 
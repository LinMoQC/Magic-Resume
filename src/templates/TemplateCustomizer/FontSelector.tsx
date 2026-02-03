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
  // 经典专业字体
  { name: 'Inter', value: 'Inter, sans-serif', preview: 'Aa' },
  { name: 'Roboto', value: 'Roboto, sans-serif', preview: 'Aa' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif', preview: 'Aa' },
  { name: 'Lato', value: 'Lato, sans-serif', preview: 'Aa' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', preview: 'Aa' },
  { name: 'Poppins', value: 'Poppins, sans-serif', preview: 'Aa' },
  
  // 年轻现代字体
  { name: 'Nunito', value: 'Nunito, sans-serif', preview: 'Aa' },
  { name: 'Quicksand', value: 'Quicksand, sans-serif', preview: 'Aa' },
  { name: 'Comfortaa', value: 'Comfortaa, sans-serif', preview: 'Aa' },
  { name: 'Raleway', value: 'Raleway, sans-serif', preview: 'Aa' },
  { name: 'Righteous', value: 'Righteous, sans-serif', preview: 'Aa' },
  
  // 手写风格字体
  { name: 'Pacifico', value: 'Pacifico, cursive', preview: 'Aa' },
  { name: 'Caveat', value: 'Caveat, cursive', preview: 'Aa' },
  { name: 'Dancing Script', value: 'Dancing Script, cursive', preview: 'Aa' },
  
  // 装饰性字体
  { name: 'Lobster', value: 'Lobster, cursive', preview: 'Aa' },
  
  // 科技感字体
  { name: 'Orbitron', value: 'Orbitron, sans-serif', preview: 'Aa' },
  { name: 'Space Mono', value: 'Space Mono, monospace', preview: 'Aa' },
  
  // 经典衬线字体
  { name: 'PT Serif', value: 'PT Serif, serif', preview: 'Aa' },
  { name: 'Playfair Display', value: 'Playfair Display, serif', preview: 'Aa' },
  
  // 等宽字体
  { name: 'JetBrains Mono', value: 'JetBrains Mono, monospace', preview: 'Aa' },
  { name: 'Source Code Pro', value: 'Source Code Pro, monospace', preview: 'Aa' },
];

export default function FontSelector({ label, value, onChange, fonts = defaultFonts }: FontSelectorProps) {
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
} 
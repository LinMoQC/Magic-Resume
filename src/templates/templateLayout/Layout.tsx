import React from 'react';

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Layout({ children, style }: Props) {
  return (
    <div
      id="resume-to-export"
      className="mx-auto max-w-[794px] w-[794px] bg-white text-black rounded-md shadow-2xl relative font-serif min-h-[1100px]"
      style={{ fontFamily: '"IBM Plex Serif", serif', ...style }}
    >
      <div className="p-3 space-y-4">
        {children}
      </div>
    </div>
  );
} 
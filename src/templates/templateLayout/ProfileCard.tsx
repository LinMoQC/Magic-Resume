import React from 'react';
import { InfoType } from '@/store/useResumeStore';
import Image from 'next/image';

interface Props {
  data: InfoType;
  style?: React.CSSProperties;
  position?: {
    area?: 'main' | 'sidebar' | 'header' | 'footer';
  };
}

export function ProfileCard({ data: info, style, position }: Props) {
  // 判断是否在侧边栏使用（双栏布局）还是主区域使用（单栏布局）
  const isInSidebar = position?.area === 'sidebar';
  
  // 根据style和位置计算颜色
  const textColor = style?.color || (isInSidebar ? '#ffffff' : '#000000');
  const subtitleColor = style?.color ? `${style.color}cc` : (isInSidebar ? '#dbeafe' : '#6b7280');
  const borderColor = style?.color || (isInSidebar ? '#ffffff' : '#d1d5db');
  
  if (isInSidebar) {
    // 侧边栏布局 - 紧凑的垂直设计
    return (
      <div 
        className="text-center"
        style={{
          ...style,
          lineHeight: 'var(--line-height)',
          letterSpacing: 'var(--letter-spacing)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--paragraph-spacing)',
        }}
      >
        {info.avatar && (
          <div className="flex justify-center">
            <Image
              src={info.avatar}
              alt="Profile"
              width={120}
              height={120}
              className="w-30 h-30 rounded-full object-cover border-4 shadow-lg"
              style={{ borderColor }}
              unoptimized
            />
          </div>
        )}
        
        <div className="space-y-2">
          <h1 className="text-xl font-bold" style={{ color: textColor }}>
            {info.fullName || 'Your Name'}
          </h1>
          
          {info.headline && (
            <p className="text-sm font-medium" style={{ color: subtitleColor }}>
              {info.headline}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 主区域布局 - 更适合单栏的设计
  return (
    <div 
      className="text-center py-8"
      style={{
        ...style,
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--section-spacing)',
      }}
    >
      {info.avatar && (
        <div className="flex justify-center">
          <Image
            src={info.avatar}
            alt="Profile"
            width={120}
            height={120}
            className="w-30 h-30 rounded-full object-cover border-4 shadow-lg"
            style={{ borderColor }}
            unoptimized
          />
        </div>
      )}
      
      <div className="space-y-3">
        <h1 className="text-2xl font-bold" style={{ color: textColor }}>
          {info.fullName || 'Your Name'}
        </h1>
        
        {info.headline && (
          <p className="text-lg font-medium" style={{ color: subtitleColor }}>
            {info.headline}
          </p>
        )}
        
        {/* 基本联系信息 - 水平排列 */}
        <div className="text-sm flex flex-wrap justify-center gap-6 mt-6" style={{ color: subtitleColor }}>
          {info.email && (
            <div className="flex items-baseline gap-2">
              <div className="flex items-center justify-center w-4 h-4">
                <span className="text-sm leading-none">📧</span>
              </div>
              <span className="leading-4">{info.email}</span>
            </div>
          )}
          {info.phoneNumber && (
            <div className="flex items-baseline gap-2">
              <div className="flex items-center justify-center w-4 h-4">
                <span className="text-sm leading-none">📱</span>
              </div>
              <span className="leading-4">{info.phoneNumber}</span>
            </div>
          )}
          {info.address && (
            <div className="flex items-baseline gap-2">
              <div className="flex items-center justify-center w-4 h-4">
                <span className="text-sm leading-none">📍</span>
              </div>
              <span className="leading-4">{info.address}</span>
            </div>
          )}
          {info.website && (
            <div className="flex items-baseline gap-2">
              <div className="flex items-center justify-center w-4 h-4">
                <span className="text-sm leading-none">🌐</span>
              </div>
              <span className="leading-4">{info.website}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
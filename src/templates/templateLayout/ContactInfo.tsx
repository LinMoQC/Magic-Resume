import React from 'react';
import { InfoType } from '@/types/frontend/resume';
import { FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';

interface Props {
  data: InfoType;
  style?: React.CSSProperties;
}

export function ContactInfo({ data: info, style }: Props) {
  const contactItems = [
    {
      icon: FaMapMarkerAlt,
      value: info.address,
      href: null
    },
    {
      icon: FaPhone,
      value: info.phoneNumber,
      href: `tel:${info.phoneNumber}`
    },
    {
      icon: FaEnvelope,
      value: info.email,
      href: `mailto:${info.email}`
    },
    {
      icon: FaGlobe,
      value: info.website,
      href: info.website
    }
  ].filter(item => item.value);

  if (contactItems.length === 0) return null;

  // 从style中获取颜色，如果没有则使用默认的白色（适合侧边栏）
  const textColor = style?.color || '#ffffff';
  const iconColor = style?.color ? `${style.color}cc` : '#dbeafe';

  return (
    <div 
      style={{
        ...style,
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--paragraph-spacing)',
      }}
    >
      <h3 
        className="text-sm font-bold uppercase tracking-wide" 
        style={{ 
          color: textColor,
          marginBottom: 'var(--paragraph-spacing)',
        }}
      >
        Contact
      </h3>
      
      <div className="space-y-3">
        {contactItems.map((item, index) => {
          const IconComponent = item.icon;
          const content = (
            <div className="flex items-center space-x-3" style={{ color: textColor, lineHeight: 1.2 }}>
              <IconComponent 
                className="w-4 h-4 flex-shrink-0" 
                style={{ 
                  color: iconColor,
                  marginTop: '-2px',
                  verticalAlign: 'top',
                  display: 'block'
                }} 
              />
              <span className="text-xs break-all">{item.value}</span>
            </div>
          );

          if (item.href) {
            return (
              <a 
                key={index}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                className="block transition-colors"
                style={{ 
                  color: textColor,
                  opacity: 0.9
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
              >
                {content}
              </a>
            );
          }

          return (
            <div key={index}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
} 
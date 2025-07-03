import React from 'react';
import { InfoType } from '@/store/useResumeStore';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import Image from 'next/image';

interface Props {
  data: InfoType;
  iconType?: 'react' | 'svg'; // 'react': React Icons, 'svg': Lucide Icons  
  style?: React.CSSProperties;
  className?: string;
}

// Lucide图标组件
const LucideIcons = {
  location: <MapPin className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  phone: <Phone className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  email: <Mail className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  website: <Globe className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />
};

export function Header({ data: info, iconType = 'svg', style, className }: Props) {
  const getIcon = (type: string) => {
    if (iconType === 'svg') {
      switch (type) {
        case 'location': return LucideIcons.location;
        case 'phone': return LucideIcons.phone;
        case 'email': return LucideIcons.email;
        case 'website': return LucideIcons.website;
        default: return null;
      }
    } else {
      switch (type) {
        case 'location': return LucideIcons.location;
        case 'phone': return LucideIcons.phone;
        case 'email': return LucideIcons.email;
        case 'website': return LucideIcons.website;
        default: return null;
      }
    }
  };

  return (
    <div 
      className={`flex items-center space-x-4 ${className || ''}`} 
      style={{
        ...style,
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
        fontFamily: 'var(--font-family-primary)',
      }}
    >
      {info.avatar && (
        <Image
          src={info.avatar}
          alt="avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border border-neutral-300"
          style={{ background: '#f3f3f3' }}
          unoptimized
        />
      )}
      <div className="space-y-0.5">
        <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
          {info.fullName || 'Your Name'}
        </div>
        {info.headline && (
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {info.headline}
          </div>
        )}
        <div 
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]" 
          style={{ 
            lineHeight: 'var(--line-height)',
            color: 'var(--color-text-secondary)'
          }}
        >
          {info.address && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <div className="flex items-center" style={{ marginTop: iconType === 'svg' ? '0' : '-2px' }}>
                {getIcon('location')}
              </div>
              <div>{info.address}</div>
            </div>
          )}
          {info.phoneNumber && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <div className="flex items-center" style={{ marginTop: iconType === 'svg' ? '0' : '-2px' }}>
                {getIcon('phone')}
              </div>
              <a href={`tel:${info.phoneNumber}`}>{info.phoneNumber}</a>
            </div>
          )}
          {info.email && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <div className="flex items-center" style={{ marginTop: iconType === 'svg' ? '0' : '-2px' }}>
                {getIcon('email')}
              </div>
              <a href={`mailto:${info.email}`}>{info.email}</a>
            </div>
          )}
          {info.website && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0">
              <div className="flex items-center" style={{ marginTop: iconType === 'svg' ? '0' : '-2px' }}>
                {getIcon('website')}
              </div>
              <a href={info.website} target="_blank" rel="noreferrer noopener nofollow" className="inline-block">{info.website}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
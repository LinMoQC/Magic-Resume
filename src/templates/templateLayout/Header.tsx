import React from 'react';
import { InfoType } from '@/types/frontend/resume';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import Image from 'next/image';

interface Props {
  data: InfoType;
  style?: React.CSSProperties;
  className?: string;
}

const LucideIcons = {
  location: <MapPin className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  phone: <Phone className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  email: <Mail className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  website: <Globe className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />
};

export const Header = React.memo(function Header({ data: info, style, className }: Props) {
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
          className="w-10 h-10 rounded-full object-cover border"
          style={{ background: 'var(--color-background)', borderColor: 'var(--color-border)' }}
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
            color: 'var(--color-text-secondary)',
          }}
        >
          {info.address && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center">{LucideIcons.location}</div>
              <span style={{ color: 'var(--color-text)' }}>{info.address}</span>
            </div>
          )}
          {info.phoneNumber && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center">{LucideIcons.phone}</div>
              <a href={`tel:${info.phoneNumber}`} style={{ color: 'var(--color-text)' }}>{info.phoneNumber}</a>
            </div>
          )}
          {info.email && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center">{LucideIcons.email}</div>
              <a href={`mailto:${info.email}`} style={{ color: 'var(--color-text)' }}>{info.email}</a>
            </div>
          )}
          {info.website && (
            <div className="flex items-center gap-x-1.5 border-r pr-2 last:border-r-0 last:pr-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center">{LucideIcons.website}</div>
              <a href={info.website} target="_blank" rel="noreferrer noopener nofollow" style={{ color: 'var(--color-text)' }}>{info.website}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

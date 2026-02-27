import React from 'react';
import { InfoType } from '@/types/frontend/resume';
import { Mail, Phone, Globe, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  data: InfoType;
  style?: React.CSSProperties;
}

export const ContactInfo = React.memo(function ContactInfo({ data: info, style }: Props) {
  const { t } = useTranslation();
  const contactItems = [
    { icon: MapPin, value: info.address, href: null },
    { icon: Phone, value: info.phoneNumber, href: `tel:${info.phoneNumber}` },
    { icon: Mail, value: info.email, href: `mailto:${info.email}` },
    { icon: Globe, value: info.website, href: info.website },
  ].filter(item => item.value);

  if (contactItems.length === 0) return null;

  const textColor = style?.color || 'var(--color-text)';
  const iconColor = style?.color ? `${style.color}cc` : 'var(--color-primary)';

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
          paddingBottom: 'var(--section-title-spacing)',
          borderBottomWidth: 'var(--title-divider-width)',
          borderBottomStyle: 'solid',
          borderBottomColor: textColor,
          marginBottom: 'var(--section-title-spacing)',
        }}
      >
        {t('common.info.contact')}
      </h3>
      
      <div className="space-y-3">
        {contactItems.map((item, index) => {
          const IconComponent = item.icon;
          const content = (
            <div className="flex items-center space-x-3" style={{ color: textColor, lineHeight: 1.2 }}>
              <IconComponent 
                className="w-4 h-4 shrink-0" 
                style={{ color: iconColor }}
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
                style={{ color: textColor, opacity: 0.9 }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
              >
                {content}
              </a>
            );
          }

          return <div key={index}>{content}</div>;
        })}
      </div>
    </div>
  );
});

import React from 'react';
import { InfoType } from '@/types/frontend/resume';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface Props {
  data: InfoType;
  style?: React.CSSProperties;
  className?: string;
  avatarPosition?: 'left' | 'right';
  avatarWidth?: number;
  avatarHeight?: number;
  avatarRounded?: boolean;
  contactStyle?: 'icon' | 'label';
  showCustomFields?: boolean;
}

const LucideIcons = {
  location: <MapPin className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  phone: <Phone className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  email: <Mail className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />,
  website: <Globe className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)', strokeWidth: 2.5 }} />
};

export const Header = React.memo(function Header({
  data: info,
  style,
  className,
  avatarPosition = 'left',
  avatarWidth = 40,
  avatarHeight = 40,
  avatarRounded = true,
  contactStyle = 'icon',
  showCustomFields = false,
}: Props) {
  const { t } = useTranslation();
  const avatarClassName = avatarRounded
    ? 'rounded-full'
    : 'rounded-md';

  const isRightAvatarLayout = avatarPosition === 'right';

  const avatarNode = info.avatar ? (
    <Image
      src={info.avatar}
      alt={t('basicForm.avatarAlt')}
      width={avatarWidth}
      height={avatarHeight}
      className={`${avatarClassName} object-cover border shrink-0`}
      style={{
        width: `${avatarWidth}px`,
        height: `${avatarHeight}px`,
        background: 'var(--color-background)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
      unoptimized
    />
  ) : null;

  const contactItems: Array<{
    key: string;
    icon: React.ReactElement;
    label: string;
    content: string;
    href?: string;
    external?: boolean;
  }> = [];

  if (info.phoneNumber) {
    contactItems.push({
      key: 'phone',
      icon: LucideIcons.phone,
      label: t('basicForm.fields.phoneNumber'),
      content: info.phoneNumber,
      href: `tel:${info.phoneNumber}`,
    });
  }
  if (info.email) {
    contactItems.push({
      key: 'email',
      icon: LucideIcons.email,
      label: t('basicForm.fields.email'),
      content: info.email,
      href: `mailto:${info.email}`,
    });
  }
  if (info.address) {
    contactItems.push({
      key: 'address',
      icon: LucideIcons.location,
      label: t('basicForm.fields.address'),
      content: info.address,
    });
  }
  if (info.website) {
    contactItems.push({
      key: 'website',
      icon: LucideIcons.website,
      label: t('basicForm.fields.website'),
      content: info.website,
      href: info.website,
      external: true,
    });
  }

  const customFieldItems = (showCustomFields ? (info.customFields || []) : [])
    .filter(field => field && field.name?.trim() && field.value?.trim())
    .map((field, index) => {
      const value = field.value.trim();
      const hasUrlProtocol = /^https?:\/\//i.test(value);
      const isDomainLike = /^(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/.test(value);
      const href = hasUrlProtocol ? value : (isDomainLike ? `https://${value}` : undefined);
      return {
        key: field.id || `custom-${index}`,
        label: field.name.trim(),
        content: value,
        href,
        external: Boolean(href),
      };
    });

  return (
    <div 
      className={`flex items-start justify-between gap-4 ${className || ''}`} 
      style={{
        ...style,
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
        fontFamily: 'var(--font-family-primary)',
      }}
    >
      {avatarPosition === 'left' && avatarNode}
      <div className="space-y-1 flex-1 min-w-0">
        <div
          className={contactStyle === 'label' ? 'text-xl font-bold' : (isRightAvatarLayout ? 'text-base font-bold' : 'text-sm font-bold')}
          style={{ color: 'var(--color-text)' }}
        >
          {info.fullName || t('resumePreview.yourName')}
        </div>
        {info.headline && (
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {info.headline}
          </div>
        )}
        {contactStyle === 'label' ? (
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]"
            style={{
              lineHeight: 'var(--line-height)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {[...contactItems, ...customFieldItems].map(item => (
              <div key={item.key} className="truncate" style={{ color: 'var(--color-text)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}：</span>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer noopener nofollow" : undefined}
                    style={{ color: 'var(--color-text)' }}
                  >
                    {item.content}
                  </a>
                ) : (
                  item.content
                )}
              </div>
            ))}
          </div>
        ) : (
          <div 
            className={`flex flex-wrap items-center gap-y-1 ${isRightAvatarLayout ? 'gap-x-1.5 text-[11px]' : 'gap-x-2 text-[10px]'}`}
            style={{ 
              lineHeight: 'var(--line-height)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {[...contactItems, ...customFieldItems].map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 && (
                  <span style={{ color: 'var(--color-border)' }}>|</span>
                )}
                {'icon' in item ? (
                  <div className="flex items-center gap-x-1">
                    <div className="flex items-center">{item.icon}</div>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noreferrer noopener nofollow" : undefined}
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.content}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--color-text)' }}>{item.content}</span>
                    )}
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-text)' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}：</span>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noreferrer noopener nofollow" : undefined}
                        style={{ color: 'var(--color-text)' }}
                      >
                        {item.content}
                      </a>
                    ) : (
                      item.content
                    )}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {avatarPosition === 'right' && <div className="shrink-0">{avatarNode}</div>}
    </div>
  );
});

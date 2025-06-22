import React from 'react';
import DOMPurify from 'dompurify';

interface Props {
  dirtyHtml: string;
  className?: string;
}

export function WysiwygContent({ dirtyHtml, className }: Props) {
  if (typeof window === 'undefined') {
    return <div className={className} />;
  }
  const cleanHtml = DOMPurify.sanitize(dirtyHtml);
  return (
    <div
      className={`wysiwyg ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
      style={{ color: 'inherit' }}
    />
  );
} 
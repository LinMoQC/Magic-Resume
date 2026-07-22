import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Renders an SVG asset from /public as a monochrome glyph. CSS `mask` +
 * `background-color: currentColor` keeps text-color inheritance working — the
 * one thing a plain <img src="*.svg"> loses — so callers keep driving color
 * via className exactly as they did with inline SVGs. Semi-transparent shapes
 * in the source file (e.g. a 0.55-opacity twinkle) survive: the mask uses the
 * image's alpha channel.
 *
 * House rule: SVG markup lives in public/ (marks/, providers/), never in JSX.
 */
export function MaskIcon({
  src,
  size,
  className,
  style,
}: {
  src: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0', className)}
      style={{
        ...(size !== undefined ? { width: size, height: size } : {}),
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        ...style,
      }}
    />
  );
}

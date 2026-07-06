import type { SVGProps } from 'react';
import { motion } from 'framer-motion';

const CHECK_ICON_VIEW_BOX = '0 0 24 24';
const CHECK_ICON_PATH = 'M5 13l4 4L19 7';
const CHECK_ICON_STROKE_WIDTH = 3;
export const DEFAULT_ANIMATED_CHECK_DURATION_SEC = 0.24;

type AnimatedCheckIconProps = SVGProps<SVGSVGElement> & {
  draw?: boolean;
  delay?: number;
  duration?: number;
};

export function AnimatedCheckIcon({
  draw = true,
  delay = 0,
  duration = DEFAULT_ANIMATED_CHECK_DURATION_SEC,
  className = 'h-3 w-3',
  ...props
}: AnimatedCheckIconProps) {
  return (
    <svg
      viewBox={CHECK_ICON_VIEW_BOX}
      className={className}
      fill="none"
      aria-hidden
      {...props}
    >
      <motion.path
        d={CHECK_ICON_PATH}
        stroke="currentColor"
        strokeWidth={CHECK_ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration, ease: 'easeOut', delay }}
      />
    </svg>
  );
}

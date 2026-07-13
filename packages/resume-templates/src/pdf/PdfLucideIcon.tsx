import React from 'react';
import {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Svg,
} from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { IconNode } from 'lucide';

interface PdfLucideIconProps {
  color?: string;
  icon: IconNode;
  size?: number;
  style?: Style;
  strokeWidth?: number;
}

type PdfSvgPrimitive = React.ComponentType<Record<string, string | number>>;
type LucidePaint = Pick<Required<PdfLucideIconProps>, 'color' | 'strokeWidth'>;

const PDF_SVG_PRIMITIVES: Record<string, PdfSvgPrimitive> = {
  circle: Circle as unknown as PdfSvgPrimitive,
  ellipse: Ellipse as unknown as PdfSvgPrimitive,
  line: Line as unknown as PdfSvgPrimitive,
  path: Path as unknown as PdfSvgPrimitive,
  polygon: Polygon as unknown as PdfSvgPrimitive,
  polyline: Polyline as unknown as PdfSvgPrimitive,
  rect: Rect as unknown as PdfSvgPrimitive,
};

const renderNode = (
  [tag, attributes]: IconNode[number],
  index: number,
  { color, strokeWidth }: LucidePaint,
) => {
  const Primitive = PDF_SVG_PRIMITIVES[tag];
  if (!Primitive) return null;

  const normalizedAttributes = Object.fromEntries(
    Object.entries(attributes).map(([name, value]) => [
      name,
      value === 'currentColor' ? color : value,
    ]),
  );

  return (
    <Primitive
      key={`${tag}-${index}`}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...normalizedAttributes}
    />
  );
};

export const PdfLucideIcon = ({
  color = 'currentColor',
  icon,
  size = 10,
  style,
  strokeWidth = 2,
}: PdfLucideIconProps) => (
  <Svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={style}
  >
    {icon.map((node, index) => renderNode(node, index, { color, strokeWidth }))}
  </Svg>
);

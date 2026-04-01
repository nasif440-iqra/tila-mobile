import React from 'react';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';

interface CrescentIconProps {
  size?: number;
  color?: string;
}

/**
 * Crescent moon icon matching the BrandedLogo style.
 * Uses an SVG mask to punch out the cutout circle, so it works over any background.
 *
 * Proportions derived from BrandedLogo.tsx:
 *   Main circle: cx=200 cy=160 r=52
 *   Cutout circle: cx=218 cy=146 r=42
 * Normalized to a 24x24 viewBox for icon usage.
 *
 * Scale: 24/104 = 0.2308 (104 = bounding box width of main circle)
 * Main circle -> center (12,12) r=12
 * Cutout offset: dx=+18*0.2308=4.15, dy=-14*0.2308=-3.23 -> center (16.15, 8.77) r=42*0.2308=9.69
 */
export function CrescentIcon({ size = 16, color = '#C4A464' }: CrescentIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <Mask id="crescentMask">
          {/* White = visible, black = hidden */}
          <Rect x={0} y={0} width={24} height={24} fill="white" />
          <Circle cx={16.15} cy={8.77} r={9.69} fill="black" />
        </Mask>
      </Defs>
      <Circle cx={12} cy={12} r={12} fill={color} mask="url(#crescentMask)" />
    </Svg>
  );
}

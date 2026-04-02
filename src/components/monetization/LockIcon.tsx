import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface LockIconProps {
  size?: number;
  color?: string;
}

/**
 * Lock icon for premium/locked content indicators.
 * Follows the CrescentIcon pattern: configurable size + color, SVG-based.
 */
export function LockIcon({ size = 14, color = '#C4A464' }: LockIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} fill={color} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

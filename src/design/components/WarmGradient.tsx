import { View } from "react-native";

interface WarmGradientProps {
  color?: string;
  height?: number;
}

/**
 * View-based warm ambient gradient that replaces expo-linear-gradient.
 * Uses stacked View layers with decreasing opacity to simulate a top-down gradient.
 * Works reliably on all devices (no native module dependency).
 */
export function WarmGradient({
  color = "#F2EADE",
  height = 300,
}: WarmGradientProps) {
  const bandCount = 5;
  const bandHeight = height / bandCount;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
        zIndex: 0,
      }}
      pointerEvents="none"
    >
      {Array.from({ length: bandCount }, (_, i) => (
        <View
          key={i}
          style={{
            height: bandHeight,
            backgroundColor: color,
            opacity: 1 - (i / bandCount),
          }}
        />
      ))}
    </View>
  );
}

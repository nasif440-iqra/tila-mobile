import { View } from "react-native";

export function WarmGlow({ size = 340, opacity = 0.12 }: { size?: number; opacity?: number }) {
  return (
    <View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "rgba(196, 164, 100, " + opacity + ")",
      }}
    />
  );
}

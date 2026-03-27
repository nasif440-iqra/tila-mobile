import { View, StyleSheet } from "react-native";
import { useColors } from "../../design/theme";

export function ProgressBar({
  current,
  total,
  colors,
}: {
  current: number;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={progressStyles.bar}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[progressStyles.track, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              progressStyles.fill,
              {
                backgroundColor: colors.primary,
                width: i < current ? "100%" : i === current ? "50%" : "0%",
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: 4,
    width: "100%",
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});

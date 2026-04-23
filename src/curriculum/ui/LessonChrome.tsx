import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform, BackHandler, Alert } from "react-native";
import { useColors } from "../../design/theme";
import { typography, spacing } from "../../design/tokens";
import type { Screen } from "../types";
import type { ReactNode } from "react";

interface Props {
  screen: Screen;
  index: number;
  total: number;
  canGoBack: boolean;
  onBack: () => void;
  onExitRequested: () => void;
  children: ReactNode;
}

const PART_LABELS: Record<string, string> = {
  "warm-recall": "Warm up",
  "practice": "Practice",
  "mastery-check": "Mastery check",
};

function confirmExit(onConfirm: () => void) {
  Alert.alert(
    "Leave lesson?",
    "Your progress in this lesson won't be saved.",
    [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onConfirm },
    ],
    { cancelable: true }
  );
}

export function LessonChrome({
  screen,
  index,
  total,
  canGoBack,
  onBack,
  onExitRequested,
  children,
}: Props) {
  const colors = useColors();
  const partLabel = screen.kind === "exercise" ? PART_LABELS[screen.part] : null;

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmExit(onExitRequested);
      return true;
    });
    return () => sub.remove();
  }, [onExitRequested]);

  const progress = total > 0 ? (index + 1) / total : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          disabled={!canGoBack}
          style={[styles.chromeBtn, { opacity: canGoBack ? 1 : 0 }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={[styles.chromeIcon, { color: colors.primary }]}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          {partLabel ? (
            <Text style={[styles.partLabel, { color: colors.textSoft }]}>{partLabel}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => confirmExit(onExitRequested)}
          style={styles.chromeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close lesson"
        >
          <Text style={[styles.chromeIcon, { color: colors.primary }]}>✕</Text>
        </Pressable>
      </View>
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: "#9AB0A0" },
            ]}
          />
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  chromeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  chromeIcon: { fontSize: 18, fontWeight: "600" },
  headerCenter: { flex: 1, alignItems: "center" },
  partLabel: { ...typography.label, letterSpacing: 1 },
  progressWrap: { paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  progressTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%" },
  body: { flex: 1 },
});

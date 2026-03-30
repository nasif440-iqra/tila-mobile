import { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../design/theme";
import { typography, spacing, radii, fontFamilies } from "../../design/tokens";
import { LESSONS } from "../../data/lessons";
import { getLetter } from "../../data/letters";

interface PhaseDetailSheetProps {
  phaseKey: number | null;
  phaseLabel: string;
  completedLessonIds: number[];
  currentLessonId: number;
  visible: boolean;
  onClose: () => void;
}

interface LessonEntry {
  id: number;
  title: string;
  description: string;
  module: string;
  moduleTitle?: string;
  teachIds: number[];
  status: "completed" | "current" | "locked";
}

export function PhaseDetailSheet({
  phaseKey,
  phaseLabel,
  completedLessonIds,
  currentLessonId,
  visible,
  onClose,
}: PhaseDetailSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // ── Motion: timing-based, no springs ──
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(20);
  const sheetOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = 0;
      sheetTranslateY.value = 20;
      sheetOpacity.value = 0;
      backdropOpacity.value = withTiming(1, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      });
      sheetTranslateY.value = withTiming(0, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
      sheetOpacity.value = withTiming(1, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    backdropOpacity.value = withTiming(0, {
      duration: 160,
      easing: Easing.in(Easing.cubic),
    });
    sheetOpacity.value = withTiming(0, {
      duration: 180,
      easing: Easing.inOut(Easing.cubic),
    });
    sheetTranslateY.value = withTiming(
      12,
      { duration: 180, easing: Easing.inOut(Easing.cubic) },
      () => {
        runOnJS(onClose)();
      }
    );
  }, [onClose]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  // ── Data: lessons for this phase ──
  const lessons: LessonEntry[] = useMemo(() => {
    if (phaseKey === null) return [];
    return LESSONS.filter((l: any) => l.phase === phaseKey).map((l: any) => {
      const isCompleted = completedLessonIds.includes(l.id);
      const isCurrent = l.id === currentLessonId;
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        module: l.module,
        moduleTitle: l.moduleTitle,
        teachIds: l.teachIds || [],
        status: isCompleted
          ? ("completed" as const)
          : isCurrent
          ? ("current" as const)
          : ("locked" as const),
      };
    });
  }, [phaseKey, completedLessonIds, currentLessonId]);

  const doneCount = lessons.filter((l) => l.status === "completed").length;
  const totalCount = lessons.length;

  // Group by module
  const modules = useMemo(() => {
    const map = new Map<string, { title: string; lessons: LessonEntry[] }>();
    for (const l of lessons) {
      if (!map.has(l.module)) {
        map.set(l.module, {
          title: l.moduleTitle || `Module ${l.module}`,
          lessons: [],
        });
      }
      map.get(l.module)!.lessons.push(l);
    }
    return [...map.values()];
  }, [lessons]);

  if (phaseKey === null) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.bgCard,
            paddingBottom: Math.max(insets.bottom, spacing.xl),
            maxHeight: "80%",
          },
          sheetAnimStyle,
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.phaseTitle, { color: colors.text }]}>
              {phaseLabel}
            </Text>
            <Text style={[styles.phaseSummary, { color: colors.textMuted }]}>
              {doneCount} of {totalCount} completed
            </Text>
          </View>
          {/* Progress ring */}
          <View
            style={[
              styles.progressBadge,
              {
                backgroundColor:
                  doneCount === totalCount && totalCount > 0
                    ? colors.primary
                    : colors.primarySoft,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.progressBadgeText,
                {
                  color:
                    doneCount === totalCount && totalCount > 0
                      ? colors.white
                      : colors.primary,
                },
              ]}
            >
              {doneCount === totalCount && totalCount > 0
                ? "\u2713"
                : `${Math.round((doneCount / Math.max(totalCount, 1)) * 100)}%`}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${
                  totalCount > 0 ? (doneCount / totalCount) * 100 : 0
                }%`,
              },
            ]}
          />
        </View>

        {/* Lesson list */}
        <ScrollView
          style={styles.lessonList}
          showsVerticalScrollIndicator={false}
        >
          {modules.map((mod, mi) => (
            <View key={mi}>
              {/* Module header */}
              <Text
                style={[styles.moduleHeader, { color: colors.brownLight }]}
              >
                {mod.title}
              </Text>

              {mod.lessons.map((lesson) => {
                const letterPreview = lesson.teachIds
                  .slice(0, 3)
                  .map((id) => getLetter(id))
                  .filter(Boolean)
                  .map((l: any) => l.letter)
                  .join(" ");

                return (
                  <View
                    key={lesson.id}
                    style={[
                      styles.lessonRow,
                      {
                        opacity: lesson.status === "locked" ? 0.45 : 1,
                      },
                    ]}
                  >
                    {/* Status indicator */}
                    <View
                      style={[
                        styles.statusDot,
                        lesson.status === "completed"
                          ? {
                              backgroundColor: colors.primary,
                              borderWidth: 0,
                            }
                          : lesson.status === "current"
                          ? {
                              backgroundColor: colors.bgCard,
                              borderColor: colors.primary,
                              borderWidth: 2,
                            }
                          : {
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                              borderWidth: 1.5,
                            },
                      ]}
                    >
                      {lesson.status === "completed" && (
                        <Text style={styles.checkmark}>{"\u2713"}</Text>
                      )}
                      {lesson.status === "current" && (
                        <View
                          style={[
                            styles.currentDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>

                    {/* Lesson info */}
                    <View style={styles.lessonInfo}>
                      <Text
                        style={[
                          styles.lessonTitle,
                          {
                            color:
                              lesson.status === "current"
                                ? colors.primary
                                : colors.text,
                            fontFamily:
                              lesson.status === "current"
                                ? fontFamilies.headingSemiBold
                                : fontFamilies.headingMedium,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {lesson.title}
                      </Text>
                      {lesson.status === "current" && (
                        <Text
                          style={[
                            styles.currentLabel,
                            { color: colors.accent },
                          ]}
                        >
                          UP NEXT
                        </Text>
                      )}
                    </View>

                    {/* Letter preview */}
                    {letterPreview ? (
                      <Text
                        style={[
                          styles.letterPreview,
                          {
                            color:
                              lesson.status === "completed"
                                ? colors.primary
                                : colors.textMuted,
                            opacity:
                              lesson.status === "completed" ||
                              lesson.status === "current"
                                ? 0.7
                                : 0.35,
                            writingDirection: "rtl",
                          },
                        ]}
                      >
                        {letterPreview}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Bottom spacing */}
          <View style={{ height: spacing.lg }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  phaseTitle: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  phaseSummary: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  progressBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBadgeText: {
    fontFamily: fontFamilies.headingSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  lessonList: {
    flex: 1,
  },
  moduleHeader: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 14,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lessonInfo: {
    flex: 1,
    minWidth: 0,
  },
  lessonTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentLabel: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  letterPreview: {
    fontFamily: fontFamilies.arabicRegular,
    fontSize: 18,
    lineHeight: 24,
    flexShrink: 0,
  },
});

import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ArabicText } from "../../design/components";
import { useColors } from "../../design/theme";
import { spacing, typography, radii, shadows, borderWidths, fontFamilies } from "../../design/tokens";
import { LESSONS } from "../../data/lessons";
import { getLetter } from "../../data/letters";
import { isLessonUnlocked } from "../../engine/unlock";
import type { MasteryState } from "../../types/mastery";

// ── Phase metadata ──

const PHASE_LABELS: Record<number, string> = {
  1: "Letter Recognition",
  2: "Letter Sounds",
  3: "Harakat (Vowels)",
  4: "Connected Forms",
};

// ── Serpentine x-offsets that repeat every 6 nodes ──

const OFFSETS = [4, 16, 8, -4, -12, 0];

// ── Icon helpers ──

function CheckIcon({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 14, color = "#6B6760" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Props ──

export interface LessonGridProps {
  currentPhase: number;
  nextLessonId: number | null;
  completedLessonIds: number[];
  mastery: MasteryState | undefined;
  today: string;
  onStartLesson: (lessonId: number) => void;
}

// ── Component ──

export default function LessonGrid({
  currentPhase,
  nextLessonId,
  completedLessonIds,
  mastery,
  today,
  onStartLesson,
}: LessonGridProps) {
  const colors = useColors();

  const currentPhaseLessons = LESSONS.filter((l) => l.phase === currentPhase);
  const phaseLabel = `Phase ${currentPhase} — ${PHASE_LABELS[currentPhase] ?? ""}`;

  return (
    <View style={styles.journeySection}>
      <Text style={[styles.journeySectionTitle, { color: colors.brownLight }]}>
        {phaseLabel.toUpperCase()}
      </Text>

      <View style={styles.journeyPath}>
        {/* Connector line */}
        <View
          style={[
            styles.connectorLine,
            { borderColor: colors.border },
          ]}
        />

        {currentPhaseLessons.map((lesson, i) => {
          const globalIndex = LESSONS.findIndex((l) => l.id === lesson.id);
          const complete = completedLessonIds.includes(lesson.id);
          const isCurrent = lesson.id === nextLessonId;
          const unlocked = isLessonUnlocked(
            globalIndex,
            completedLessonIds,
            mastery?.entities || {},
            today
          );
          const locked = !complete && !isCurrent && !unlocked;
          const letters = (lesson.teachIds || []).map((id: number) => getLetter(id));
          const firstLetter = letters[0];
          const offset = OFFSETS[i % OFFSETS.length];

          return (
            <Pressable
              key={lesson.id}
              onPress={() => {
                if (!locked) onStartLesson(lesson.id);
              }}
              disabled={locked}
              style={[
                styles.nodeRow,
                {
                  transform: [{ translateX: offset }],
                  opacity: locked ? 0.4 : complete ? 0.85 : 1,
                },
              ]}
            >
              {/* Node circle */}
              {complete ? (
                <View
                  style={[
                    styles.nodeCircle,
                    styles.nodeComplete,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <CheckIcon size={16} color={colors.accent} />
                </View>
              ) : isCurrent ? (
                <View
                  style={[
                    styles.nodeCircle,
                    styles.nodeCurrent,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <View
                    style={[styles.currentDot, { backgroundColor: colors.primary }]}
                  />
                </View>
              ) : (
                <View
                  style={[
                    styles.nodeCircle,
                    styles.nodeLocked,
                    {
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {firstLetter ? (
                    <ArabicText
                      size="body"
                      color={colors.textMuted}
                      style={{ fontSize: 18, lineHeight: 24 }}
                    >
                      {firstLetter.letter}
                    </ArabicText>
                  ) : (
                    <LockIcon size={14} color={colors.textMuted} />
                  )}
                </View>
              )}

              {/* Label */}
              {isCurrent ? (
                <View
                  style={[
                    styles.currentLabel,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.currentLabelTitle, { color: colors.brown }]}>
                    {lesson.title}
                  </Text>
                  <View style={styles.upNextRow}>
                    <View style={[styles.upNextDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.upNextText, { color: colors.accent }]}>Up next</Text>
                  </View>
                </View>
              ) : (
                <View>
                  <Text
                    style={[
                      styles.nodeTitle,
                      { color: locked ? colors.textMuted : colors.text },
                    ]}
                  >
                    {lesson.title}
                  </Text>
                  <Text
                    style={[
                      styles.nodeSubtitle,
                      { color: locked ? colors.textMuted : colors.textSoft },
                    ]}
                  >
                    {complete ? "Completed" : locked ? "Locked" : "Available"}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  journeySection: {
    marginTop: spacing.lg,
  },
  journeySectionTitle: {
    ...typography.label,
    marginBottom: spacing.xl,
  },
  journeyPath: {
    position: "relative",
    paddingLeft: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  connectorLine: {
    position: "absolute",
    left: 50,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: borderWidths.thick,
    borderStyle: "dashed",
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  nodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nodeComplete: {
    ...shadows.card,
  },
  nodeCurrent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: borderWidths.thick,
    ...shadows.card,
  },
  nodeLocked: {
    borderWidth: borderWidths.thick,
  },
  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  currentLabel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    ...shadows.card,
  },
  currentLabelTitle: {
    ...typography.cardHeadline,
    fontSize: 15,
  },
  upNextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  upNextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  upNextText: {
    ...typography.label,
  },
  nodeTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bodyMedium,
  },
  nodeSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.bodyRegular,
    marginTop: spacing.xs,
  },
});

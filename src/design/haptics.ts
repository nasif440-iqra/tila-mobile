import * as Haptics from "expo-haptics";

/** Tier 1: Light tap for interactive presses (buttons, options, cards) */
export function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Tier 2: Success notification (correct answers, lesson complete) */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Tier 3: Error notification (wrong answers) */
export function hapticError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Milestone: Heavy impact for significant achievements */
export function hapticMilestone() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Selection change: subtle feedback for picker/selection changes */
export function hapticSelection() {
  Haptics.selectionAsync();
}

import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { advanceCursor } from "./cursor";

export type LessonRunnerProps<T> = {
  screens: T[];
  onComplete: () => void;
  renderScreen: (
    screen: T,
    helpers: { advance: () => void; index: number; total: number }
  ) => ReactNode;
};

/**
 * Shape-neutral lesson runtime. Tracks current screen index + advance only.
 * Does NOT define what a screen is — caller supplies screens + renderScreen.
 * This is intentional: the new curriculum defines its own screen types.
 */
export function LessonRunner<T>({ screens, onComplete, renderScreen }: LessonRunnerProps<T>) {
  const [index, setIndex] = useState(0);

  const advance = useCallback(() => {
    const result = advanceCursor(index, screens.length);
    if (result.complete) {
      onComplete();
    } else if (result.nextIndex !== null) {
      setIndex(result.nextIndex);
    }
  }, [index, screens.length, onComplete]);

  if (screens.length === 0) return null;
  return <>{renderScreen(screens[index], { advance, index, total: screens.length })}</>;
}

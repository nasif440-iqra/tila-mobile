import type { ReactNode } from "react";
import { View, Text } from "react-native";
import type { Exercise } from "../../types";
import type { EntityAttempt, ScreenOutcome } from "../../runtime/LessonRunner";
import { TapExercise } from "./TapExercise";
import { HearExercise } from "./HearExercise";

interface DispatchArgs {
  screenId: string;
  exercise: Exercise;
  retryMode: "until-correct" | "one-shot";
  advance: (outcome?: ScreenOutcome) => void;
  reportAttempt: (attempts: EntityAttempt[]) => void;
  onPlayAudio?: (path: string) => void;
}

export function renderExercise({
  screenId,
  exercise,
  retryMode,
  advance,
  reportAttempt,
  onPlayAudio,
}: DispatchArgs): ReactNode {
  switch (exercise.type) {
    case "tap":
      return (
        <TapExercise
          screenId={screenId}
          exercise={exercise}
          retryMode={retryMode}
          advance={(o) => advance(o)}
          reportAttempt={reportAttempt}
          onPlayAudio={onPlayAudio}
        />
      );
    case "hear":
      return (
        <HearExercise
          screenId={screenId}
          exercise={exercise}
          advance={advance}
          reportAttempt={reportAttempt}
          onPlayAudio={onPlayAudio}
        />
      );
    case "choose":
    case "build":
    case "read":
    case "fix":
      return <UnimplementedExercise type={exercise.type} />;
  }
}

function UnimplementedExercise({ type }: { type: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text>{`Exercise type "${type}" not yet implemented.`}</Text>
    </View>
  );
}

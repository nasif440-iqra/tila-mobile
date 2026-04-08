import React from "react";
import type { ExerciseItem } from "@/src/types/exercise";
import { TapExercise } from "./TapExercise";
import { HearExercise } from "./HearExercise";
import { ChooseExercise } from "./ChooseExercise";
import { BuildExercise } from "./BuildExercise";
import { ReadExercise } from "./ReadExercise";
import { FixExercise } from "./FixExercise";

interface ExerciseRendererProps {
  item: ExerciseItem;
  onAnswer: (correct: boolean, answerId: string) => void;
}

export function ExerciseRenderer({ item, onAnswer }: ExerciseRendererProps) {
  switch (item.type) {
    case "tap":
      return <TapExercise item={item} onAnswer={onAnswer} />;
    case "hear":
      return <HearExercise item={item} onAnswer={onAnswer} />;
    case "choose":
      return <ChooseExercise item={item} onAnswer={onAnswer} />;
    case "build":
      return <BuildExercise item={item} onAnswer={onAnswer} />;
    case "read":
      return <ReadExercise item={item} onAnswer={onAnswer} />;
    case "fix":
      return <FixExercise item={item} onAnswer={onAnswer} />;
    default:
      return null;
  }
}

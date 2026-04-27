import { describe, it, expect } from "vitest";
import type { ReadExercise } from "../../curriculum/types";

describe("ReadExercise contract", () => {
  it("requires audioModel — SPEC Constraint 2 (no-cueing)", () => {
    // @ts-expect-error — audioModel is required; Read without a model is
    // incoherent (a Read screen with no model cannot reveal anything).
    const _bad: ReadExercise = {
      type: "read",
      prompt: "Read this.",
      target: "letter:ba",
      display: "بَ",
    };
    void _bad;

    const ok: ReadExercise = {
      type: "read",
      prompt: "Try saying it first.",
      target: "combo:ba+fatha",
      display: "بَ",
      audioModel: "audio/letter/ba_fatha_sound.mp3",
      revealCopy: "That's ba.",
    };
    expect(ok.audioModel.length).toBeGreaterThan(0);
  });
});

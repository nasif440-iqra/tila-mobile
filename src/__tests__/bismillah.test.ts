import { describe, it, expect } from "vitest";

describe("BismillahMoment", () => {
  describe("MIND-01: Renders with correct text and auto-advances", () => {
    it.todo("renders Bismillah Arabic text");
    it.todo("calls hapticSelection on mount");
    it.todo("auto-advances after BISMILLAH_DISPLAY_DURATION");
    it.todo("has no button or skip mechanism");
  });
});

describe("BismillahOverlay", () => {
  describe("MIND-02: Session detection works correctly", () => {
    it.todo("shouldShowBismillah returns true on first call");
    it.todo("shouldShowBismillah returns false after markBismillahShown");
    it.todo("overlay auto-fades after 2500ms with 500ms fade duration");
    it.todo("BismillahOverlay renders with bgWarm background at 0.97 opacity");
  });
});

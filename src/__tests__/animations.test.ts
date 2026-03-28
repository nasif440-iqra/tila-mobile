import { describe, it, expect, vi } from "vitest";

// Mock react-native-reanimated Easing (returns composable functions)
vi.mock("react-native-reanimated", () => {
  const makeEasing = (name: string) => {
    const fn = (t: number) => t;
    fn._name = name;
    return fn;
  };
  return {
    Easing: {
      out: (inner: { _name?: string }) => makeEasing(`out(${inner._name})`),
      in: (inner: { _name?: string }) => makeEasing(`in(${inner._name})`),
      inOut: (inner: { _name?: string }) => makeEasing(`inOut(${inner._name})`),
      cubic: Object.assign((t: number) => t, { _name: "cubic" }),
      exp: Object.assign((t: number) => t, { _name: "exp" }),
      ease: Object.assign((t: number) => t, { _name: "ease" }),
    },
  };
});

import {
  springs,
  durations,
  staggers,
  easings,
  screenTransitions,
  pressScale,
} from "../design/animations";

describe("animations presets", () => {
  describe("springs", () => {
    it("has press, bouncy, gentle, snap keys", () => {
      expect(springs).toHaveProperty("press");
      expect(springs).toHaveProperty("bouncy");
      expect(springs).toHaveProperty("gentle");
      expect(springs).toHaveProperty("snap");
    });

    it("press has stiffness 400, damping 20, mass 0.8", () => {
      expect(springs.press).toEqual({ stiffness: 400, damping: 20, mass: 0.8 });
    });

    it("gentle has stiffness 200, damping 22", () => {
      expect(springs.gentle).toEqual({ stiffness: 200, damping: 22 });
    });

    it("each spring has stiffness and damping", () => {
      for (const key of Object.keys(springs) as Array<keyof typeof springs>) {
        expect(springs[key]).toHaveProperty("stiffness");
        expect(springs[key]).toHaveProperty("damping");
      }
    });
  });

  describe("durations", () => {
    it("has correct duration values", () => {
      expect(durations.fast).toBe(150);
      expect(durations.micro).toBe(200);
      expect(durations.normal).toBe(300);
      expect(durations.slow).toBe(400);
      expect(durations.dramatic).toBe(600);
    });
  });

  describe("staggers", () => {
    it("has fast, normal, dramatic keys with delay and duration", () => {
      expect(staggers.fast).toHaveProperty("delay");
      expect(staggers.fast).toHaveProperty("duration");
      expect(staggers.normal).toHaveProperty("delay");
      expect(staggers.normal).toHaveProperty("duration");
      expect(staggers.dramatic).toHaveProperty("delay");
      expect(staggers.dramatic).toHaveProperty("duration");
    });

    it("fast stagger delay is 50", () => {
      expect(staggers.fast.delay).toBe(50);
    });
  });

  describe("easings", () => {
    it("has contentReveal, entrance, exit, smooth keys", () => {
      expect(easings).toHaveProperty("contentReveal");
      expect(easings).toHaveProperty("entrance");
      expect(easings).toHaveProperty("exit");
      expect(easings).toHaveProperty("smooth");
    });

    it("each easing is a function", () => {
      expect(typeof easings.contentReveal).toBe("function");
      expect(typeof easings.entrance).toBe("function");
      expect(typeof easings.exit).toBe("function");
      expect(typeof easings.smooth).toBe("function");
    });
  });

  describe("screenTransitions", () => {
    it("has correct transition duration values", () => {
      expect(screenTransitions.slideUp).toBe(400);
      expect(screenTransitions.fade).toBe(300);
      expect(screenTransitions.push).toBe(350);
      expect(screenTransitions.feedback).toBe(200);
    });
  });

  describe("pressScale", () => {
    it("has correct scale values", () => {
      expect(pressScale.normal).toBe(0.97);
      expect(pressScale.subtle).toBe(0.98);
      expect(pressScale.bouncy).toBe(0.95);
    });
  });
});

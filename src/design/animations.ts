import { Easing } from "react-native-reanimated";

export const springs = {
  press: { stiffness: 400, damping: 20, mass: 0.8 },
  bouncy: { stiffness: 300, damping: 18 },
  gentle: { stiffness: 200, damping: 22 },
  snap: { stiffness: 500, damping: 25 },
} as const;

export const durations = {
  fast: 150,
  micro: 200,
  normal: 300,
  slow: 400,
  dramatic: 600,
} as const;

export const staggers = {
  fast: { delay: 50, duration: 300 },
  normal: { delay: 80, duration: 400 },
  dramatic: { delay: 120, duration: 600 },
} as const;

export const easings = {
  contentReveal: Easing.out(Easing.cubic),
  entrance: Easing.out(Easing.exp),
  exit: Easing.in(Easing.cubic),
  smooth: Easing.inOut(Easing.ease),
} as const;

export const screenTransitions = {
  slideUp: 400,
  fade: 300,
  push: 350,
  feedback: 200,
} as const;

export const pressScale = {
  normal: 0.97,
  subtle: 0.98,
  bouncy: 0.95,
} as const;

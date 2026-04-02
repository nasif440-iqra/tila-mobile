// Vitest global setup — mock native modules that can't run in Node environment
import { vi } from "vitest";

vi.mock("posthog-react-native", () => ({
  default: class PostHog {
    capture() {}
    identify() {}
    flush() {}
    getAnonymousId() { return null; }
  },
}));

vi.mock("@sentry/react-native", () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

vi.mock("react-native-purchases", () => ({
  default: {
    getCustomerInfo: vi.fn().mockResolvedValue({
      entitlements: { active: {}, all: {} },
      managementURL: null,
    }),
    addCustomerInfoUpdateListener: vi.fn(),
    removeCustomerInfoUpdateListener: vi.fn(),
    configure: vi.fn(),
    setLogLevel: vi.fn(),
  },
  LOG_LEVEL: { VERBOSE: "VERBOSE" },
}));

vi.mock("react-native-purchases-ui", () => ({
  default: {
    presentPaywall: vi.fn().mockResolvedValue(0),
  },
  PAYWALL_RESULT: {
    NOT_PRESENTED: 0,
    ERROR: 1,
    CANCELLED: 2,
    PURCHASED: 3,
    RESTORED: 4,
  },
}));

vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  Alert: { alert: vi.fn() },
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
}));

vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
  NotificationFeedbackType: { Success: "Success", Error: "Error", Warning: "Warning" },
}));

vi.mock("react-native-svg", () => ({
  default: "Svg",
  Svg: "Svg",
  Rect: "Rect",
  Path: "Path",
  Circle: "Circle",
  Defs: "Defs",
  Mask: "Mask",
}));

vi.mock("react-native-reanimated", () => {
  const identity = (v: unknown) => v;
  const easingFn = () => identity;
  return {
    default: {
      View: "Animated.View",
      createAnimatedComponent: (c: unknown) => c,
    },
    useSharedValue: vi.fn((v: unknown) => ({ value: v })),
    useAnimatedStyle: vi.fn((fn: () => unknown) => fn()),
    withTiming: vi.fn((v: unknown) => v),
    withDelay: vi.fn((_d: unknown, v: unknown) => v),
    withSpring: vi.fn((v: unknown) => v),
    FadeIn: { delay: vi.fn().mockReturnValue({}) },
    Easing: {
      in: easingFn,
      out: easingFn,
      inOut: easingFn,
      linear: identity,
      cubic: identity,
      exp: identity,
      bezier: () => identity,
    },
  };
});

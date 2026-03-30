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
}));

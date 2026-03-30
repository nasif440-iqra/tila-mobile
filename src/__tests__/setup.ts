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

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("CONT-03: Screen-level error boundaries", () => {
  describe("Lesson screen", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../app/lesson/[id].tsx"),
      "utf-8"
    );

    it("imports ErrorBoundary from react-error-boundary", () => {
      expect(source).toMatch(/import.*ErrorBoundary.*from.*react-error-boundary/);
    });

    it("wraps content in ErrorBoundary", () => {
      expect(source).toMatch(/<ErrorBoundary/);
    });

    it("reports to Sentry in onError callback", () => {
      expect(source).toMatch(/Sentry\.captureException/);
    });

    it("uses ScreenErrorFallback as FallbackComponent", () => {
      expect(source).toMatch(/FallbackComponent={ScreenErrorFallback}/);
    });
  });

  describe("Home screen", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../app/(tabs)/index.tsx"),
      "utf-8"
    );

    it("imports ErrorBoundary from react-error-boundary", () => {
      expect(source).toMatch(/import.*ErrorBoundary.*from.*react-error-boundary/);
    });

    it("wraps content in ErrorBoundary", () => {
      expect(source).toMatch(/<ErrorBoundary/);
    });

    it("reports to Sentry in onError callback", () => {
      expect(source).toMatch(/Sentry\.captureException/);
    });

    it("uses ScreenErrorFallback as FallbackComponent", () => {
      expect(source).toMatch(/FallbackComponent={ScreenErrorFallback}/);
    });
  });

  describe("ScreenErrorFallback component", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../components/feedback/ScreenErrorFallback.tsx"),
      "utf-8"
    );

    it("accepts FallbackProps from react-error-boundary", () => {
      expect(source).toMatch(/FallbackProps/);
    });

    it("has Try Again button that calls resetErrorBoundary", () => {
      expect(source).toMatch(/resetErrorBoundary/);
      expect(source).toMatch(/Try Again/);
    });

    it("has Go Home button that navigates to root", () => {
      expect(source).toMatch(/Go Home/);
      expect(source).toMatch(/router\.replace/);
    });

    it("uses useColors for branded appearance", () => {
      expect(source).toMatch(/useColors\(\)/);
    });
  });

  describe("Root boundary untouched", () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, "../../app/_layout.tsx"),
      "utf-8"
    );

    it("still has Sentry.ErrorBoundary as root catch-all", () => {
      expect(source).toMatch(/Sentry\.ErrorBoundary/);
    });

    it("uses ErrorFallback (not ScreenErrorFallback) at root", () => {
      expect(source).toMatch(/ErrorFallback/);
      expect(source).not.toMatch(/ScreenErrorFallback/);
    });
  });
});

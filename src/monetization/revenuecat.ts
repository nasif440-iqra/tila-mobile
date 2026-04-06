import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import * as Sentry from "@sentry/react-native";

let _initialized = false;

export function initRevenueCat(): void {
  if (_initialized) return;

  const apiKey = Platform.OS === "ios"
    ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "")
    : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "");

  if (!apiKey) {
    console.warn("RevenueCat init skipped: API key not set");
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    console.log("[RevenueCat] Initializing with key:", apiKey.slice(0, 10) + "...");
  }

  // Defer configure to avoid TurboModule ObjC exceptions on startup.
  // RevenueCat will be configured on first subscription check instead.
  setTimeout(() => {
    try {
      Purchases.configure({ apiKey });
      _initialized = true;
      if (__DEV__) {
        console.log("[RevenueCat] Configured successfully");
      }
    } catch (e) {
      Sentry.captureException(e);
      console.warn('RevenueCat init failed:', e);
      // _initialized remains false — app defaults to free tier
    }
  }, 2000);
}

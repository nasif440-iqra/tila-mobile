import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

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

  Purchases.configure({ apiKey });
  _initialized = true;
  if (__DEV__) {
    console.log("[RevenueCat] Configured successfully");
  }
}

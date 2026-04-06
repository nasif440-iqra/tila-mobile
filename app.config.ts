import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "tila.app",
  name: "Tila",
  slug: "tila",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "tila",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#F8F6F0",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.tilaapp.tila",
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
      ],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeOtherUsageData",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: [
            "NSPrivacyCollectedDataTypePurposeAppFunctionality",
          ],
        },
      ],
    },
    infoPlist: {
      UIBackgroundModes: [],
      ITSAppUsesNonExemptEncryption: false,
    },
    usesAppleSignIn: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundColor: "#F8F6F0",
    },
    package: "com.tila.app",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-splash-screen",
    "expo-sqlite",
    "expo-audio",
    "expo-secure-store",
    "expo-asset",
    "expo-apple-authentication",
    "expo-web-browser",
    // "@react-native-google-signin/google-signin", // disabled for beta — re-enable with monetization
    // ["@sentry/react-native/expo", { organization: "tila", project: "tila-mobile" }], // disabled for beta — native module crashes on iOS
  ],
  extra: {
    eas: {
      projectId: "c0ef7427-a094-45c2-b7cd-bef77dae665b",
    },
  },
  experiments: {
    typedRoutes: true,
  },
});

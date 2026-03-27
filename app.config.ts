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
    bundleIdentifier: "com.tila.app",
    infoPlist: {
      UIBackgroundModes: [],
    },
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
    [
      "@sentry/react-native/expo",
      {
        organization: "tila",
        project: "tila-mobile",
      },
    ],
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

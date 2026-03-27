import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
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
      foregroundImage: "./assets/images/adaptive-icon.png",
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
  ],
  experiments: {
    typedRoutes: true,
  },
});

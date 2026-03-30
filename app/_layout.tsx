import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import { AnalyticsGate } from "../src/components/shared/AnalyticsGate";
import { AppLoadingScreen } from "../src/components/feedback/AppLoadingScreen";
import { ErrorFallback } from "../src/components/feedback/ErrorFallback";
import {
  Amiri_400Regular,
  Amiri_700Bold,
} from "@expo-google-fonts/amiri";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_400Regular_Italic,
} from "@expo-google-fonts/lora";
import { ThemeContext, resolveColors, type ThemeMode } from "../src/design/theme";
import { DatabaseProvider } from "../src/db/provider";
import { initRevenueCat } from "../src/monetization/revenuecat";
import { SubscriptionProvider } from "../src/monetization/provider";

// Prevent splash from auto-hiding — we control when it goes away
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const systemScheme = useColorScheme();
  // Force light mode — dark mode ships later
  const [themeMode] = useState<ThemeMode>("light");

  const [fontsLoaded, fontError] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_400Regular_Italic,
  });

  useEffect(() => {
    initRevenueCat();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const { colors, mode } = resolveColors(themeMode, systemScheme);

  return (
    <ThemeContext.Provider value={{ colors, mode }}>
      <Sentry.ErrorBoundary fallback={({ resetError }) => (
        <ErrorFallback onRetry={resetError} />
      )}>
        <DatabaseProvider fallback={<AppLoadingScreen />}>
          <SubscriptionProvider>
          <AnalyticsGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: "fade",
              animationDuration: 300,
            }}
          >
            <Stack.Screen
              name="lesson/[id]"
              options={{
                animation: "slide_from_bottom",
                animationDuration: 400,
              }}
            />
            <Stack.Screen
              name="lesson/review"
              options={{
                animation: "slide_from_bottom",
                animationDuration: 400,
              }}
            />
          </Stack>
          </AnalyticsGate>
          </SubscriptionProvider>
        </DatabaseProvider>
      </Sentry.ErrorBoundary>
    </ThemeContext.Provider>
  );
}

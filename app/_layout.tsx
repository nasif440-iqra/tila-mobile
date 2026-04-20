import { useEffect, type ReactNode } from "react";
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
import { ThemeContext, resolveColors, useColors } from "../src/design/theme";
import { DatabaseProvider } from "../src/db/provider";
import { SubscriptionProvider } from "../src/monetization/provider";
import { AuthProvider } from "../src/auth/provider";
import { SyncProvider } from "../src/sync/provider";
import { AppStateProvider } from "../src/state/provider";
import { SocialProvider } from "../src/social/provider";
import { useThemePreference } from "../src/hooks/useThemePreference";

// Prevent splash from auto-hiding — we control when it goes away
SplashScreen.preventAutoHideAsync();

/**
 * ThemeWrapper lives inside DatabaseProvider so it can read the user's
 * theme preference from SQLite. Falls back to system scheme until loaded.
 */
function ThemeWrapper({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { themeMode, loaded } = useThemePreference();

  // Use 'system' until preference is loaded from DB
  const effectiveMode = loaded ? themeMode : "system";
  const scheme = systemScheme as "light" | "dark" | null | undefined;
  const { colors, mode } = resolveColors(effectiveMode, scheme);

  return (
    <ThemeContext.Provider value={{ colors, mode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * AppNavigator consumes ThemeContext to apply dynamic background color
 * to the navigation stack's content style.
 */
function AppNavigator() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "fade",
        animationDuration: 200,
      }}
    >
    </Stack>
  );
}

export default function RootLayout() {
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
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Sentry.ErrorBoundary fallback={({ resetError }) => (
      <ErrorFallback onRetry={resetError} />
    )}>
      <DatabaseProvider fallback={<AppLoadingScreen />}>
        <ThemeWrapper>
          <AuthProvider>
            <SyncProvider>
              <SubscriptionProvider>
                <AppStateProvider>
                  <SocialProvider>
                  <AnalyticsGate>
                    <AppNavigator />
                  </AnalyticsGate>
                  </SocialProvider>
                </AppStateProvider>
              </SubscriptionProvider>
            </SyncProvider>
          </AuthProvider>
        </ThemeWrapper>
      </DatabaseProvider>
    </Sentry.ErrorBoundary>
  );
}

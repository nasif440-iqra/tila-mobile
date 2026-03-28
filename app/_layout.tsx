import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { initAnalytics, track } from "../src/analytics";
import * as SecureStore from "expo-secure-store";
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
import { screenTransitions } from "../src/design/animations";
import { DatabaseProvider } from "../src/db/provider";

// Prevent splash from auto-hiding — we control when it goes away
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const systemScheme = useColorScheme();
  // Force light mode — dark mode ships later
  const [themeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    initAnalytics();

    (async () => {
      const installDate = await SecureStore.getItemAsync('tila_install_date');
      const today = new Date().toISOString().slice(0, 10);
      const firstOpen = !installDate;

      if (firstOpen) {
        await SecureStore.setItemAsync('tila_install_date', today);
      }

      const daysSinceInstall = installDate
        ? Math.floor((Date.now() - new Date(installDate).getTime()) / 86400000)
        : 0;

      track('app_opened', { first_open: firstOpen, days_since_install: daysSinceInstall });
    })();
  }, []);

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

  const { colors, mode } = resolveColors(themeMode, systemScheme);

  return (
    <ThemeContext.Provider value={{ colors, mode }}>
      <DatabaseProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade",
            animationDuration: screenTransitions.fade,
          }}
        >
          {/* Modal/overlay screens: slide up (per D-10) */}
          <Stack.Screen
            name="lesson/[id]"
            options={{
              animation: "slide_from_bottom",
              animationDuration: screenTransitions.slideUp,
            }}
          />
          <Stack.Screen
            name="lesson/review"
            options={{
              animation: "slide_from_bottom",
              animationDuration: screenTransitions.slideUp,
            }}
          />
          <Stack.Screen
            name="wird-intro"
            options={{
              animation: "slide_from_bottom",
              animationDuration: screenTransitions.slideUp,
            }}
          />
          <Stack.Screen
            name="phase-complete"
            options={{
              animation: "slide_from_bottom",
              animationDuration: screenTransitions.slideUp,
            }}
          />
          <Stack.Screen
            name="post-lesson-onboard"
            options={{
              animation: "slide_from_bottom",
              animationDuration: screenTransitions.slideUp,
            }}
          />
          {/* Fade screens: onboarding, return-welcome, (tabs) use default animation: "fade" */}
        </Stack>
      </DatabaseProvider>
    </ThemeContext.Provider>
  );
}

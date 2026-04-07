import { useEffect, useState } from "react";
import { useAppState } from "../../state/hooks";
import { initAnalytics, enablePostHog, track } from "../../analytics";
import * as SecureStore from "expo-secure-store";
import { AnalyticsConsentModal } from "./AnalyticsConsentModal";

export function AnalyticsGate({ children }: { children: React.ReactNode }) {
  const appState = useAppState();
  const [analyticsReady, setAnalyticsReady] = useState(false);

  const consent = appState.progress?.analyticsConsent ?? null;

  // Initialize analytics with consent status once progress loads
  useEffect(() => {
    if (appState.loading) return;
    if (analyticsReady) return;

    initAnalytics(consent);

    // Track app_opened if consent given
    (async () => {
      const installDate = await SecureStore.getItemAsync("tila_install_date");
      const today = new Date().toISOString().slice(0, 10);
      const firstOpen = !installDate;
      if (firstOpen) {
        await SecureStore.setItemAsync("tila_install_date", today);
      }
      const daysSinceInstall = installDate
        ? Math.floor((Date.now() - new Date(installDate).getTime()) / 86400000)
        : 0;
      if (consent === true) {
        track("app_opened", { first_open: firstOpen, days_since_install: daysSinceInstall });
      }
    })();

    setAnalyticsReady(true);
  }, [appState.loading, consent, analyticsReady]);

  // Show consent modal: user is onboarded but hasn't been asked yet
  const showModal =
    analyticsReady &&
    !appState.loading &&
    appState.progress?.onboarded === true &&
    consent === null;

  async function handleAccept() {
    await appState.updateProfile({ analyticsConsent: true });
    enablePostHog();
  }

  async function handleDecline() {
    await appState.updateProfile({ analyticsConsent: false });
  }

  return (
    <>
      {children}
      <AnalyticsConsentModal
        visible={showModal ?? false}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </>
  );
}

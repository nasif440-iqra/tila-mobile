import { useEffect, useState } from "react";
import { useProgress } from "../../hooks/useProgress";
import { initAnalytics, enablePostHog, track } from "../../analytics";
import * as SecureStore from "expo-secure-store";
import { AnalyticsConsentModal } from "./AnalyticsConsentModal";

export function AnalyticsGate({ children }: { children: React.ReactNode }) {
  const progress = useProgress();
  const [analyticsReady, setAnalyticsReady] = useState(false);

  // Initialize analytics with consent status once progress loads
  useEffect(() => {
    if (progress.loading) return;
    if (analyticsReady) return;

    const consent = progress.analyticsConsent ?? null;
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
  }, [progress.loading, progress.analyticsConsent, analyticsReady]);

  // Show consent modal: user is onboarded but hasn't been asked yet
  const showModal =
    analyticsReady &&
    !progress.loading &&
    progress.onboarded === true &&
    progress.analyticsConsent === null;

  async function handleAccept() {
    await progress.updateProfile({ analyticsConsent: true });
    enablePostHog();
  }

  async function handleDecline() {
    await progress.updateProfile({ analyticsConsent: false });
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

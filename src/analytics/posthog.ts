// src/analytics/posthog.ts
import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export function initPostHog(): void {
  if (client) return;
  if (!POSTHOG_API_KEY) {
    console.warn('PostHog init skipped: EXPO_PUBLIC_POSTHOG_KEY is not set');
    return;
  }
  client = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    captureAppLifecycleEvents: false,
    enableSessionReplay: false,
    preloadFeatureFlags: false,
    personProfiles: 'identified_only',
  });
}

export function getPostHog(): PostHog | null {
  return client;
}

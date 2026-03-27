// src/analytics/posthog.ts
import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

const POSTHOG_API_KEY = '__POSTHOG_API_KEY__';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export function initPostHog(): void {
  if (client) return;
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

// src/analytics/sentry.ts
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('Sentry init skipped: EXPO_PUBLIC_SENTRY_DSN is not set');
    return;
  }
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0,
    enabled: !__DEV__,
  });
}

export function setSentryUser(id: string): void {
  Sentry.setUser({ id });
}

// src/analytics/sentry.ts
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = 'https://467c433b59b68c88ed9f74e4bd670802@o4511118918483968.ingest.us.sentry.io/4511118922416128';

export function initSentry(): void {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0,
    enabled: !__DEV__,
  });
}

export function setSentryUser(id: string): void {
  Sentry.setUser({ id });
}

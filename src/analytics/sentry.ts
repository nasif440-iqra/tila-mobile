// src/analytics/sentry.ts
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = '__SENTRY_DSN__';

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

// src/analytics/index.ts
import { initPostHog, getPostHog } from './posthog';
import { initSentry, setSentryUser } from './sentry';
import type { PostHogEventProperties } from '@posthog/core';
import type { EventMap, EventName } from './events';

export type { EventMap, EventName } from './events';

let _initialized = false;

export function initAnalytics(analyticsConsent: boolean | null): void {
  if (_initialized) return;
  _initialized = true;

  // Sentry crash reporting always runs (legitimate interest exemption)
  try { initSentry(); } catch (e) { console.warn('Sentry init failed:', e); }

  // PostHog only if user explicitly consented
  if (analyticsConsent === true) {
    try { initPostHog(); } catch (e) { console.warn('PostHog init failed:', e); }
    const ph = getPostHog();
    if (ph) {
      const anonId = ph.getAnonymousId();
      if (anonId) setSentryUser(anonId);
    }
  }
}

/** Enable PostHog mid-session after user grants consent */
export function enablePostHog(): void {
  try { initPostHog(); } catch (e) { console.warn('PostHog init failed:', e); }
  const ph = getPostHog();
  if (ph) {
    const anonId = ph.getAnonymousId();
    if (anonId) setSentryUser(anonId);
  }
}

export function track<E extends EventName>(event: E, properties: EventMap[E]): void {
  const ph = getPostHog();
  if (!ph) return;
  ph.capture(event, properties as unknown as PostHogEventProperties);
}

export function identify(userId: string): void {
  const ph = getPostHog();
  if (ph) ph.identify(userId);
  setSentryUser(userId);
}

export function flush(): void {
  const ph = getPostHog();
  if (ph) ph.flush();
}

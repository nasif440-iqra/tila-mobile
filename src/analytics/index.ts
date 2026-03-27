// src/analytics/index.ts
import { initPostHog, getPostHog } from './posthog';
import { initSentry, setSentryUser } from './sentry';
import type { PostHogEventProperties } from '@posthog/core';
import type { EventMap, EventName } from './events';

export type { EventMap, EventName } from './events';

let _initialized = false;

export function initAnalytics(): void {
  if (_initialized) return;
  _initialized = true;

  try { initPostHog(); } catch (e) { console.warn('PostHog init failed:', e); }
  try { initSentry(); } catch (e) { console.warn('Sentry init failed:', e); }

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

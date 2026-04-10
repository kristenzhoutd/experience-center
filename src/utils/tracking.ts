/**
 * Unified event dispatcher — fires to both GA4 and TD.
 * Import trackAll instead of trackEvent in components.
 */

import { trackEvent as gaTrackEvent } from './analytics';
import { tdTrackEvent, tdSetGlobal } from './td-analytics';

const GLOBAL_KEYS = ['goal_id', 'industry_id', 'scenario_id'] as const;

export function trackAll(eventName: string, params?: Record<string, unknown>): void {
  // GA4 — unchanged behavior
  gaTrackEvent(eventName, params);

  // TD — fire same event with auto td_client_id
  tdTrackEvent(eventName, params);

  // Progressively set TD globals when funnel context params are present
  if (params) {
    for (const key of GLOBAL_KEYS) {
      if (params[key] != null) {
        tdSetGlobal(key, params[key]);
      }
    }
  }
}

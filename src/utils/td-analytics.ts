/**
 * Treasure Data JavaScript SDK wrapper — mirrors analytics.ts pattern.
 * All functions guard on td existence so TD failure never breaks GA4 or Marketo.
 */

import Treasure from 'td-js-sdk';

const TD_DATABASE = import.meta.env.VITE_TD_DATABASE || '';
const TD_WRITE_KEY = import.meta.env.VITE_TD_WRITE_KEY || '';
const TD_HOST = import.meta.env.VITE_TD_HOST || 'in.treasuredata.com';

let td: Treasure | null = null;

export function initializeTD(): void {
  if (!TD_WRITE_KEY || !TD_DATABASE || td) return;

  td = new Treasure({
    database: TD_DATABASE,
    writeKey: TD_WRITE_KEY,
    host: TD_HOST,
    startInSignedMode: true,
  });

  td.setSignedMode();
}

export function tdTrackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!td) return;
  td.trackEvent('experience_events', { event_name: eventName, ...params });
}

export function tdSetGlobal(key: string, value: unknown): void {
  if (!td) return;
  td.set('$global', key, value);
}

export function tdGetClientId(): string | undefined {
  if (!td) return undefined;
  try {
    return td.getTrackValues().td_client_id;
  } catch {
    return undefined;
  }
}

export function tdSubmitLead(record: Record<string, unknown>): void {
  if (!td) return;
  const clientId = tdGetClientId();
  td.addRecord('leads', { td_client_id: clientId, ...record });
}

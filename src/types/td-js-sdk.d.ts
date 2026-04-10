declare module 'td-js-sdk' {
  interface TreasureConfig {
    database: string;
    writeKey: string;
    host?: string;
    development?: boolean;
    logging?: boolean;
    startInSignedMode?: boolean;
    clientId?: string;
    storage?: object | string;
    pathname?: string;
  }

  interface TrackValues {
    td_client_id: string;
    td_charset: string;
    td_language: string;
    td_color: string;
    td_screen: string;
    td_viewport: string;
    td_title: string;
    td_url: string;
    td_host: string;
    td_path: string;
    td_referrer: string;
    td_user_agent: string;
    td_platform: string;
    [key: string]: string;
  }

  class Treasure {
    constructor(config: TreasureConfig);
    trackEvent(table: string, record?: Record<string, unknown>, success?: () => void, error?: () => void): void;
    trackPageview(table: string, success?: () => void, error?: () => void): void;
    addRecord(table: string, record: Record<string, unknown>, success?: () => void, error?: () => void): void;
    set(table: string, key: string, value: unknown): void;
    set(table: string, properties: Record<string, unknown>): void;
    get(table: string): Record<string, unknown>;
    setSignedMode(): void;
    setAnonymousMode(keepIdentifier?: boolean): void;
    blockEvents(): void;
    unblockEvents(): void;
    ready(fn: () => void): void;
    getTrackValues(): TrackValues;
    resetUUID(suggestedStorage?: object, suggestedClientId?: string): void;
    trackClicks(options?: Record<string, unknown>): void;
    fetchGlobalID(success?: (globalId: string) => void, error?: (err: Error) => void, forceFetch?: boolean, options?: Record<string, unknown>): void;
    fetchServerCookie(success?: (id: string) => void, error?: (err: Error) => void, forceFetch?: boolean): void;
  }

  export default Treasure;
}

/**
 * Structured slide output contract for Experience Center deck generation.
 */

export type SlideLayout = 'title' | 'summary' | 'content' | 'kpi' | 'actions' | 'two-column' | 'journey' | 'segments';

export interface Slide {
  title: string;
  subtitle?: string;
  layout: SlideLayout;
  bullets?: string[];
  speakerNotes?: string;
  kpis?: Array<{ name: string; value: string; note?: string }>;
  actions?: Array<{ action: string; priority: string }>;
  columns?: { left: string[]; right: string[] };
}

export interface DeckData {
  title: string;
  subtitle?: string;
  slides: Slide[];
  meta?: {
    outcome?: string;
    industry?: string;
    scenario?: string;
    generatedAt?: string;
  };
}

export type DeckLength = 3 | 5 | 7;
export type DeckStyle = 'executive' | 'strategy' | 'working';

export interface DeckConfig {
  length: DeckLength;
  style: DeckStyle;
  customTitle?: string;
}

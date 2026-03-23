/**
 * Structured slide output contract for Experience Center deck generation.
 */

export type SlideLayout = 'cover' | 'hero' | 'strategy' | 'segments' | 'journey' | 'kpi' | 'diagnosis' | 'channels' | 'actions' | 'impact';

export interface Slide {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  // hero / impact
  stat?: string;
  statLabel?: string;
  // strategy / hero
  highlight?: string;
  bullets?: string[];
  // segments
  segments?: Array<{ name: string; score: number; description: string; level: string }>;
  // journey
  stages?: Array<{ name: string; description: string; channel?: string }>;
  // kpi
  kpis?: Array<{ name: string; value: string; note?: string }>;
  // diagnosis
  findings?: Array<{ label: string; detail: string; severity: string }>;
  // channels
  channels?: Array<{ name: string; role: string; percent: number }>;
  // actions
  actions?: Array<{ action: string; priority: string }>;
  // speaker notes
  speakerNotes?: string;
}

export interface DeckData {
  title: string;
  subtitle?: string;
  slides: Slide[];
}

export type DeckLength = 3 | 5 | 7;
export type DeckStyle = 'executive' | 'strategy' | 'working';

export interface DeckConfig {
  length: DeckLength;
  style: DeckStyle;
  customTitle?: string;
}

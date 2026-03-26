import { storage } from './storage';

export interface CompanyDescription {
  name: string;
  description: string;
  products: string[];
  source: 'user-provided' | 'ai-inferred';
}

export interface Industry {
  primary: string;
  subIndustry: string;
  source: 'user-provided' | 'ai-inferred';
}

export interface RegulatoryFramework {
  name: string;
  description: string;
  copyImplications: string[];
  source: 'user-provided' | 'ai-inferred';
}

export interface SeasonalTrend {
  event: string;
  timing: string;
  relevance: string;
  source: 'user-provided' | 'ai-inferred';
}

export interface CategoryBenchmark {
  metric: string;
  industryAverage: string;
  topQuartile: string;
  source: 'user-provided' | 'ai-inferred';
}

export interface Competitor {
  name: string;
  description: string;
  valueProps: string[];
  differentiators: string[];
  source: 'user-provided' | 'ai-inferred';
}

export interface Persona {
  name: string;
  role: string;
  demographics: string;
  goals: string[];
  painPoints: string[];
  preferredChannels: string[];
  messagingAngle: string;
  source: 'user-provided' | 'ai-inferred';
}

export interface CompanyContext {
  id: string;
  companyDescription: CompanyDescription;
  industry: Industry;
  regulatoryFrameworks: RegulatoryFramework[];
  seasonalTrends: SeasonalTrend[];
  categoryBenchmarks: CategoryBenchmark[];
  competitors: Competitor[];
  personas: Persona[];
  lastUpdated: string;
}

const CONTEXTS_KEY = 'ai-suites:company-contexts';
const ACTIVE_ID_KEY = 'ai-suites:company-context-active-id';
function generateId(): string {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ──────────────────────────────────────────────
// Multi-context CRUD
// ──────────────────────────────────────────────

export function loadCompanyContexts(): CompanyContext[] {
  try {
    const raw = storage.getItem(CONTEXTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getActiveContextId(): string | null {
  return storage.getItem(ACTIVE_ID_KEY);
}

export function setActiveContextId(id: string | null): void {
  if (id) {
    storage.setItem(ACTIVE_ID_KEY, id);
  } else {
    storage.removeItem(ACTIVE_ID_KEY);
  }
}

/**
 * Load the currently-active company context (used by skill auto-injection).
 * Returns null if no active context is set.
 */
export function loadCompanyContext(): CompanyContext | null {
  const id = getActiveContextId();
  const list = loadCompanyContexts();
  if (id) {
    return list.find((c) => c.id === id) ?? null;
  }
  // No active context selected — fall back to most recently updated
  if (list.length > 0) {
    return list.sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )[0];
  }
  return null;
}

/**
 * Save (upsert) a company context into the list and set it as active.
 * Assigns an ID if missing.
 */
export function saveCompanyContext(context: CompanyContext | (Omit<CompanyContext, 'id'> & { id?: string })): CompanyContext {
  const id = context.id || generateId();
  const ctx: CompanyContext = { ...context, id } as CompanyContext;

  const list = loadCompanyContexts();
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) {
    list[idx] = ctx;
  } else {
    list.push(ctx);
  }

  storage.setItem(CONTEXTS_KEY, JSON.stringify(list));
  setActiveContextId(id);
  return ctx;
}

/**
 * Delete a specific company context by ID.
 * If the deleted context was the active one, clears the active ID.
 */
export function deleteCompanyContext(id: string): void {
  const list = loadCompanyContexts().filter((c) => c.id !== id);
  storage.setItem(CONTEXTS_KEY, JSON.stringify(list));

  if (getActiveContextId() === id) {
    setActiveContextId(null);
  }
}

/**
 * Clear the active context selection (does NOT delete any saved contexts).
 * Used when starting a new context from scratch.
 */
export function clearCompanyContext(): void {
  setActiveContextId(null);
}

/**
 * Merge a partial update into the currently-active company context.
 * Array fields append-and-deduplicate by name; scalar fields overwrite.
 */
export function mergeCompanyContext(partial: Partial<CompanyContext>): CompanyContext {
  const existing = loadCompanyContext();
  const base: CompanyContext = existing ?? {
    id: generateId(),
    companyDescription: { name: '', description: '', products: [], source: 'user-provided' },
    industry: { primary: '', subIndustry: '', source: 'user-provided' },
    regulatoryFrameworks: [],
    seasonalTrends: [],
    categoryBenchmarks: [],
    competitors: [],
    personas: [],
    lastUpdated: new Date().toISOString(),
  };

  const merged: CompanyContext = { ...base };

  // Scalar overwrites
  if (partial.companyDescription) {
    merged.companyDescription = partial.companyDescription;
  }
  if (partial.industry) {
    merged.industry = partial.industry;
  }

  // Array append-and-deduplicate by name
  if (partial.regulatoryFrameworks) {
    merged.regulatoryFrameworks = deduplicateByName(
      base.regulatoryFrameworks,
      partial.regulatoryFrameworks,
    );
  }
  if (partial.seasonalTrends) {
    merged.seasonalTrends = deduplicateByField(
      base.seasonalTrends,
      partial.seasonalTrends,
      'event',
    );
  }
  if (partial.categoryBenchmarks) {
    merged.categoryBenchmarks = deduplicateByField(
      base.categoryBenchmarks,
      partial.categoryBenchmarks,
      'metric',
    );
  }
  if (partial.competitors) {
    merged.competitors = deduplicateByName(base.competitors, partial.competitors);
  }
  if (partial.personas) {
    merged.personas = deduplicateByName(base.personas, partial.personas);
  }

  merged.lastUpdated = partial.lastUpdated || new Date().toISOString();

  return saveCompanyContext(merged);
}

export function getCompanyContextText(): string {
  const ctx = loadCompanyContext();
  if (!ctx) return '';
  return JSON.stringify(ctx);
}

// ============ Helpers ============

function deduplicateByName<T extends { name: string }>(
  existing: T[],
  incoming: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of existing) {
    map.set(item.name.toLowerCase(), item);
  }
  for (const item of incoming) {
    map.set(item.name.toLowerCase(), item);
  }
  return Array.from(map.values());
}

function deduplicateByField<K extends string, T extends { [P in K]: string }>(
  existing: T[],
  incoming: T[],
  field: K,
): T[] {
  const map = new Map<string, T>();
  for (const item of existing) {
    map.set(item[field].toLowerCase(), item);
  }
  for (const item of incoming) {
    map.set(item[field].toLowerCase(), item);
  }
  return Array.from(map.values());
}

import type { IndustryContext } from '../types.js';
import { retailContext } from './retail.js';
import { cpgContext } from './cpg.js';
import { travelContext } from './travel.js';

const industryContexts: Record<string, IndustryContext> = {
  retail: retailContext,
  cpg: cpgContext,
  travel: travelContext,
};

export function getIndustryContext(industryId: string): IndustryContext {
  const ctx = industryContexts[industryId];
  if (!ctx) throw new Error(`Unknown industry: ${industryId}`);
  return ctx;
}

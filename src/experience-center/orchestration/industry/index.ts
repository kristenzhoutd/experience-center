import type { IndustryContext } from '../types';
import { retailContext } from './retail';
import { cpgContext } from './cpg';
import { travelContext } from './travel';

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

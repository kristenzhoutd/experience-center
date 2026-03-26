import { storage } from './storage';

export interface BrandGuideline {
  id: string;
  name: string;
  content: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

const BRAND_GUIDELINES_KEY = 'personalization-studio:brand-guidelines';

export function loadBrandGuidelines(): BrandGuideline[] {
  try {
    const raw = storage.getItem(BRAND_GUIDELINES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBrandGuidelines(guidelines: BrandGuideline[]): void {
  storage.setItem(BRAND_GUIDELINES_KEY, JSON.stringify(guidelines));
}

export function deleteBrandGuideline(id: string): void {
  const guidelines = loadBrandGuidelines().filter((g) => g.id !== id);
  saveBrandGuidelines(guidelines);
}

export function getAllGuidelineText(): string {
  const guidelines = loadBrandGuidelines();
  if (guidelines.length === 0) return '';
  return guidelines
    .map((g) => `--- Brand Guideline: ${g.name} ---\n${g.content}`)
    .join('\n\n');
}

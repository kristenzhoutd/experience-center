/**
 * Parser for campaign-review-json code fence output.
 * Extracts review suggestions (displayed, not auto-applied).
 */

export interface ReviewIssue {
  severity: 'error' | 'warning' | 'info';
  step: number;
  field: string;
  message: string;
  suggestion: string;
}

export interface ReviewSuggestion {
  step: number;
  message: string;
}

export interface CampaignReviewResult {
  overallScore: number;
  summary: string;
  issues: ReviewIssue[];
  suggestions: ReviewSuggestion[];
}

const FENCE_REGEX = /```campaign-review-json\s*\n([\s\S]*?)```/;

export function parseCampaignReviewOutput(content: string): CampaignReviewResult | null {
  const match = content.match(FENCE_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim());

    return {
      overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 0,
      summary: String(parsed.summary || ''),
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.map((i: Record<string, unknown>) => ({
            severity: (['error', 'warning', 'info'].includes(String(i.severity))
              ? i.severity
              : 'info') as ReviewIssue['severity'],
            step: Number(i.step) || 1,
            field: String(i.field || ''),
            message: String(i.message || ''),
            suggestion: String(i.suggestion || ''),
          }))
        : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map((s: Record<string, unknown>) => ({
            step: Number(s.step) || 1,
            message: String(s.message || ''),
          }))
        : [],
    };
  } catch {
    console.warn('[CampaignReviewParser] Failed to parse JSON from code fence');
    return null;
  }
}

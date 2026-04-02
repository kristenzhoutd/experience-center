/**
 * Browser-side Treasure Data CDP API client.
 * Calls the TD CDP API directly (CORS supported).
 */

import { storage } from '../utils/storage';

function getTdxApiKey(): string {
  return storage.getItem('ai-suites-tdx-api-key') || import.meta.env.VITE_SANDBOX_API_KEY || '';
}

function getCdpEndpoint(): string {
  try {
    const settingsJson = storage.getItem('ai-suites:settings');
    const stored = settingsJson ? JSON.parse(settingsJson).tdxEndpoint || '' : '';
    if (!stored) return 'https://api-cdp.treasuredata.com';

    const url = new URL(stored);
    if (url.hostname.startsWith('api.')) {
      url.hostname = url.hostname.replace('api.', 'api-cdp.');
      return url.toString().replace(/\/$/, '');
    }
    if (url.hostname.startsWith('api-cdp.')) {
      return stored;
    }
  } catch { /* fall through */ }

  return 'https://api-cdp.treasuredata.com';
}

async function tdApiGet(endpoint: string, apiKey: string, baseUrl: string): Promise<{ statusCode: number; body: string }> {
  const url = new URL(endpoint, baseUrl);
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `TD1 ${apiKey}`,
      Accept: 'application/json',
    },
    redirect: 'follow',
  });
  const body = await response.text();
  return { statusCode: response.status, body };
}

function formatPopulation(population: number | null | undefined): string | null {
  if (population == null) return null;
  const num = Number(population);
  if (isNaN(num)) return null;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export interface ParentSegment {
  id: string;
  name: string;
  count: string | null;
  description: string;
  masterTable: string | null;
}

export interface ChildSegment {
  id: string;
  name: string;
  count: string | null;
  description: string;
  folderPath: string | null;
}

export async function fetchParentSegments(): Promise<{ success: boolean; data?: ParentSegment[]; error?: string }> {
  const apiKey = getTdxApiKey();
  if (!apiKey) {
    return { success: false, error: 'TDX API key is not configured. Please set it in Settings.' };
  }

  const baseUrl = getCdpEndpoint();
  try {
    const response = await tdApiGet('/audiences', apiKey, baseUrl);

    if (response.statusCode >= 400) {
      return {
        success: false,
        error: response.statusCode === 401
          ? 'TDX API key is invalid or expired. Please update it in Settings.'
          : `Failed to fetch parent segments (HTTP ${response.statusCode})`,
      };
    }

    const data = JSON.parse(response.body);
    const audiences = Array.isArray(data) ? data : (data.audiences || data.data || []);

    const parentSegments: ParentSegment[] = audiences.map((seg: any) => ({
      id: String(seg.id ?? seg.audienceId ?? ''),
      name: seg.name ?? seg.audienceName ?? '',
      count: formatPopulation(seg.population ?? seg.count ?? null),
      description: seg.description ?? '',
      masterTable: seg.masterTable ?? seg.master?.parentTableName ?? null,
    }));

    parentSegments.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return { success: true, data: parentSegments };
  } catch {
    return { success: false, error: 'Failed to fetch parent segments from Treasure Data' };
  }
}

export interface ParentSegmentDetail {
  id: string;
  name: string;
  population: number | null;
  masterTable: string | null;
  attributeGroups: Array<{
    groupName: string;
    attributes: Array<{ name: string; type: string; column: string }>;
  }>;
  behaviors: Array<{
    name: string;
    fields: Array<{ name: string; type: string }>;
  }>;
}

export async function fetchParentSegmentDetail(parentId: string): Promise<{ success: boolean; data?: ParentSegmentDetail; error?: string }> {
  const apiKey = getTdxApiKey();
  if (!apiKey) {
    return { success: false, error: 'TDX API key is not configured.' };
  }

  const baseUrl = getCdpEndpoint();
  try {
    const response = await tdApiGet(
      `/audiences/${encodeURIComponent(parentId)}`,
      apiKey,
      baseUrl
    );

    if (response.statusCode >= 400) {
      return {
        success: false,
        error: `Failed to fetch parent segment detail (HTTP ${response.statusCode})`,
      };
    }

    const data: any = JSON.parse(response.body);

    const population: number | null = data.population ?? null;
    const masterTable: string | null = data.master?.parentTableName ?? null;

    // Group attributes by groupingName
    const attrsByGroup = new Map<string, Array<{ name: string; type: string; column: string }>>();
    const rawAttrs: any[] = Array.isArray(data.attributes) ? data.attributes : [];
    for (const attr of rawAttrs) {
      const groupName: string = attr.groupingName || 'Ungrouped';
      if (!attrsByGroup.has(groupName)) {
        attrsByGroup.set(groupName, []);
      }
      attrsByGroup.get(groupName)!.push({
        name: attr.name ?? '',
        type: attr.type ?? 'string',
        column: attr.parentColumn ?? '',
      });
    }
    const attributeGroups = Array.from(attrsByGroup.entries()).map(([groupName, attributes]) => ({
      groupName,
      attributes,
    }));

    // Map behaviors to name + schema fields
    const rawBehaviors: any[] = Array.isArray(data.behaviors) ? data.behaviors : [];
    const behaviors = rawBehaviors.map((beh: any) => ({
      name: beh.name ?? '',
      fields: Array.isArray(beh.schema)
        ? beh.schema.map((f: any) => ({ name: f.name ?? '', type: f.type ?? 'string' }))
        : [],
    }));

    const detail: ParentSegmentDetail = {
      id: String(data.id ?? parentId),
      name: data.name ?? '',
      population,
      masterTable,
      attributeGroups,
      behaviors,
    };

    return { success: true, data: detail };
  } catch {
    return { success: false, error: 'Failed to fetch parent segment detail from Treasure Data' };
  }
}

export async function fetchChildSegments(parentId: string): Promise<{ success: boolean; data?: ChildSegment[]; error?: string }> {
  const apiKey = getTdxApiKey();
  if (!apiKey) {
    return { success: false, error: 'TDX API key is not configured.' };
  }

  const baseUrl = getCdpEndpoint();
  try {
    const response = await tdApiGet(
      `/audiences/${encodeURIComponent(parentId)}/segments`,
      apiKey,
      baseUrl
    );

    if (response.statusCode >= 400) {
      return {
        success: false,
        error: `Failed to fetch child segments (HTTP ${response.statusCode})`,
      };
    }

    const data = JSON.parse(response.body);
    const segments = Array.isArray(data) ? data : (data.segments || data.data || []);

    const flatSegments: any[] = [];
    const flatten = (items: any[], folderPath = '') => {
      for (const item of items) {
        if (item.segments || item.children) {
          const subPath = folderPath ? `${folderPath}/${item.name}` : item.name;
          flatten(item.segments || item.children, subPath);
        } else {
          flatSegments.push({ ...item, folderPath: folderPath || undefined });
        }
      }
    };
    flatten(segments);

    const seenIds = new Set<string>();
    const childSegments: ChildSegment[] = flatSegments
      .filter((seg: any) => {
        const id = String(seg.id ?? seg.segmentId ?? '');
        if (!id || seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      })
      .map((seg: any) => ({
        id: String(seg.id ?? seg.segmentId ?? ''),
        name: seg.name ?? seg.segmentName ?? '',
        count: formatPopulation(seg.population ?? seg.count ?? null),
        description: seg.description ?? '',
        folderPath: seg.folderPath ?? null,
      }));

    childSegments.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return { success: true, data: childSegments };
  } catch {
    return { success: false, error: 'Failed to fetch child segments from Treasure Data' };
  }
}

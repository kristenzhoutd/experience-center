/**
 * Parent segments routes — fetches parent segments and child segments
 * from the Treasure Data CDP API using the stored TDX API key.
 */

import { Router } from 'express';
import { loadSettings } from '../services/storage.js';

export const segmentsRouter = Router();

// ---------- Helpers ----------

function getTdxApiKey(req: any): string {
  return req.headers['x-tdx-api-key'] as string
    || loadSettings().tdxApiKey
    || '';
}

function getCdpEndpoint(): string {
  // The CDP API lives on api-cdp.treasuredata.com, not the regular api.treasuredata.com.
  // If the stored endpoint is the regular API, derive the CDP endpoint from it.
  const stored = loadSettings().tdxEndpoint || '';
  if (!stored) return 'https://api-cdp.treasuredata.com';

  // Convert api.treasuredata.com → api-cdp.treasuredata.com
  // Convert api.eu01.treasuredata.com → api-cdp.eu01.treasuredata.com
  // Convert api.ap01.treasuredata.com → api-cdp.ap01.treasuredata.com
  try {
    const url = new URL(stored);
    if (url.hostname.startsWith('api.')) {
      url.hostname = url.hostname.replace('api.', 'api-cdp.');
      return url.toString().replace(/\/$/, '');
    }
    if (url.hostname.startsWith('api-cdp.')) {
      return stored; // Already a CDP endpoint
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

// ---------- Routes ----------

// GET /api/segments/parents — list all parent segments
segmentsRouter.get('/parents', async (req, res) => {
  const apiKey = getTdxApiKey(req);
  if (!apiKey) {
    res.json({ success: false, error: 'TDX API key is not configured. Please set it in Settings.' });
    return;
  }

  const baseUrl = getCdpEndpoint();
  try {
    const response = await tdApiGet('/audiences', apiKey, baseUrl);

    if (response.statusCode >= 400) {
      console.error(`[Segments] Parent segments request failed (${response.statusCode}):`, response.body.slice(0, 500));
      res.json({
        success: false,
        error: response.statusCode === 401
          ? 'TDX API key is invalid or expired. Please update it in Settings.'
          : `Failed to fetch parent segments (HTTP ${response.statusCode})`,
      });
      return;
    }

    const data = JSON.parse(response.body);
    const audiences = Array.isArray(data) ? data : (data.audiences || data.data || []);

    const parentSegments = audiences.map((seg: any) => ({
      id: String(seg.id ?? seg.audienceId ?? ''),
      name: seg.name ?? seg.audienceName ?? '',
      count: formatPopulation(seg.population ?? seg.count ?? null),
      description: seg.description ?? '',
      masterTable: seg.masterTable ?? seg.master?.parentTableName ?? null,
    }));

    parentSegments.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

    console.log(`[Segments] Found ${parentSegments.length} parent segments`);
    res.json({ success: true, data: parentSegments });
  } catch (error: any) {
    console.error('[Segments] Error fetching parent segments:', error);
    res.json({
      success: false,
      error: 'Failed to fetch parent segments from Treasure Data',
    });
  }
});

// GET /api/segments/children/:parentId — list child segments for a parent
segmentsRouter.get('/children/:parentId', async (req, res) => {
  const apiKey = getTdxApiKey(req);
  if (!apiKey) {
    res.json({ success: false, error: 'TDX API key is not configured.' });
    return;
  }

  const baseUrl = getCdpEndpoint();
  const { parentId } = req.params;

  try {
    const response = await tdApiGet(
      `/audiences/${encodeURIComponent(parentId)}/segments`,
      apiKey,
      baseUrl
    );

    if (response.statusCode >= 400) {
      console.error(`[Segments] Child segments request failed (${response.statusCode}):`, response.body.slice(0, 500));
      res.json({
        success: false,
        error: `Failed to fetch child segments (HTTP ${response.statusCode})`,
      });
      return;
    }

    const data = JSON.parse(response.body);
    const segments = Array.isArray(data) ? data : (data.segments || data.data || []);

    // Flatten nested folder structures if present
    const flatSegments: any[] = [];
    const flatten = (items: any[], folderPath = '') => {
      for (const item of items) {
        if (item.segments || item.children) {
          const subPath = folderPath ? `${folderPath}/${item.name}` : item.name;
          flatten(item.segments || item.children, subPath);
        } else {
          flatSegments.push({
            ...item,
            folderPath: folderPath || undefined,
          });
        }
      }
    };
    flatten(segments);

    const seenIds = new Set<string>();
    const childSegments = flatSegments
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

    childSegments.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

    console.log(`[Segments] Found ${childSegments.length} child segments for parent ${parentId}`);
    res.json({ success: true, data: childSegments });
  } catch (error: any) {
    console.error('[Segments] Error fetching child segments:', error);
    res.json({
      success: false,
      error: 'Failed to fetch child segments from Treasure Data',
    });
  }
});

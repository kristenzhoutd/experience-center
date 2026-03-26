import { useMemo } from 'react';
import { storage } from '../utils/storage';
import { campaignConfigStorage } from '../services/campaignConfigStorage';
import { localBriefStorage } from '../services/briefStorage';
import { Tag } from '@/design-system';

interface UsedIn {
  id: string;
  name: string;
  type: 'brief' | 'campaign';
}

interface AudienceEntry {
  id: string;
  name: string;
  description: string;
  count: string | null;
  isNew: boolean;
  source: 'tdx' | 'brief';
  usedIn: UsedIn[];
}

interface Audience {
  id: string;
  name: string;
  type: 'segment' | 'local';
  status: string;
  count: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_AUDIENCES_KEY = 'personalization-studio:local-audiences';

function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export default function AudiencesPage() {
  const audiences = useMemo(() => {
    const map = new Map<string, AudienceEntry>();

    // 1. Collect segments from briefs
    const briefs = localBriefStorage.listBriefs();
    for (const brief of briefs) {
      const recommended = brief.sections?.audience?.recommendedAudiences;
      if (!Array.isArray(recommended)) continue;

      for (const seg of recommended) {
        if (!seg.isSelected) continue;

        const key = normalizeKey(seg.name);
        const existing = map.get(key);

        if (existing) {
          existing.usedIn.push({ id: brief.id, name: brief.name, type: 'brief' });
        } else {
          map.set(key, {
            id: seg.tdxSegmentId || normalizeKey(seg.name),
            name: seg.name,
            description: seg.description || '',
            count: seg.estimatedSize || null,
            isNew: seg.status === 'new',
            source: seg.status === 'new' ? 'brief' : 'tdx',
            usedIn: [{ id: brief.id, name: brief.name, type: 'brief' }],
          });
        }
      }
    }

    // 2. Collect segments from campaign configs
    const configs = campaignConfigStorage.listConfigs();
    for (const config of configs) {
      const segments = config.audiences?.segments;
      if (!Array.isArray(segments)) continue;

      for (const seg of segments) {
        if (!seg.isSelected) continue;

        const key = normalizeKey(seg.name);
        const existing = map.get(key);

        if (existing) {
          existing.usedIn.push({ id: config.id, name: config.setup?.name || 'Untitled Campaign', type: 'campaign' });
          // Prefer campaign data for count if not already set
          if (!existing.count && seg.count) {
            existing.count = seg.count;
          }
        } else {
          map.set(key, {
            id: seg.id,
            name: seg.name,
            description: seg.description || '',
            count: seg.count || null,
            isNew: seg.isNew,
            source: seg.source || (seg.isNew ? 'brief' : 'tdx'),
            usedIn: [{ id: config.id, name: config.setup?.name || 'Untitled Campaign', type: 'campaign' }],
          });
        }
      }
    }

    // 3. Sort alphabetically by name
    const sorted = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    // 4. Persist new segments to storage
    const newSegments: Audience[] = sorted
      .filter((entry) => entry.isNew)
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        type: 'local' as const,
        status: 'new',
        count: entry.count,
        description: entry.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    if (newSegments.length > 0) {
      try {
        storage.setItem(LOCAL_AUDIENCES_KEY, JSON.stringify(newSegments));
      } catch {
        // storage full or unavailable — ignore
      }
    }

    return sorted;
  }, []);

  return (
    <div className="h-full p-4">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* Header */}
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-medium text-gray-900">Audiences</h1>
              <p className="text-sm text-gray-500 mt-1">
                Segments used across your campaign briefs and configurations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {audiences.length} segment{audiences.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {audiences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No segments in use yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Segments will appear here when you add audiences to your campaign briefs or configurations.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {audiences.map((entry) => (
                  <AudienceCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AudienceCard({ entry }: { entry: AudienceEntry }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-gray-900 truncate">{entry.name}</h3>
            {entry.isNew ? (
              <Tag variant="success" style={{ fontSize: '12px', backgroundColor: '#e7f7f1', color: '#0a6a47', borderRadius: '6px' }}>
                New
              </Tag>
            ) : (
              <Tag variant="success" style={{ fontSize: '12px', backgroundColor: '#e7f7f1', color: '#0a6a47', borderRadius: '6px' }}>
                Existing
              </Tag>
            )}
          </div>

          {entry.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{entry.description}</p>
          )}

          {entry.usedIn.length > 0 && (
            <div className="flex items-center mt-3">
              <Tag
                variant="neutral"
                style={{ fontSize: '12px' }}
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                }
              >
                {`${entry.usedIn.length} campaign${entry.usedIn.length !== 1 ? 's' : ''}`}
              </Tag>
            </div>
          )}
        </div>

        {entry.count && (
          <div className="ml-6 text-right shrink-0">
            <p className="text-lg font-semibold text-gray-900">{entry.count}</p>
            <p className="text-xs text-gray-400">profiles</p>
          </div>
        )}
      </div>
    </div>
  );
}

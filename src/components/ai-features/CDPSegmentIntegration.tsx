import { useState, useMemo, useCallback } from 'react';
import {
  Users, Search, Filter, TrendingUp, TrendingDown, Target, Layers,
  RefreshCw, Sparkles, BarChart3, ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip, Legend,
} from 'recharts';

interface CDPSegment {
  id: string;
  name: string;
  description: string;
  audienceSize: number;
  parentSegmentName?: string;
  lastUpdated: string;
  status: 'active' | 'building' | 'paused';
  attributes: string[];
}

interface SegmentPerformance {
  segmentId: string;
  segmentName: string;
  audienceSize: number;
  matchedUsers: number;
  matchRate: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
  cpa: number;
  roas: number;
}

interface SegmentOverlap {
  segment1Name: string;
  segment2Name: string;
  overlapSize: number;
  overlapPercentage1: number;
  overlapPercentage2: number;
}

interface CDPSegmentIntegrationProps {
  campaignId: string;
  onSegmentSelect?: (segmentId: string) => void;
  onAskAI?: (question: string) => void;
}

const CHART_COLORS = ['#8B5CF6', '#A855F7', '#C084FC', '#D8B4FE', '#E9D5FF'];

const generateMockSegments = (): CDPSegment[] => [
  { id: 'seg-1', name: 'High-Value Customers', description: 'Customers with LTV > $1000 in the last 12 months', audienceSize: 125430, parentSegmentName: 'Customer 360', lastUpdated: '2 hours ago', status: 'active', attributes: ['ltv', 'purchase_count', 'last_purchase_date'] },
  { id: 'seg-2', name: 'Cart Abandoners', description: 'Users who added items but did not complete checkout', audienceSize: 89234, parentSegmentName: 'Customer 360', lastUpdated: '1 hour ago', status: 'active', attributes: ['cart_value', 'abandoned_date'] },
  { id: 'seg-3', name: 'New Subscribers', description: 'Email subscribers in the last 30 days', audienceSize: 45621, parentSegmentName: 'Marketing Contacts', lastUpdated: '30 mins ago', status: 'building', attributes: ['subscription_date', 'source'] },
  { id: 'seg-4', name: 'Churning Risk', description: 'Users with declining engagement scores', audienceSize: 32145, parentSegmentName: 'Customer 360', lastUpdated: '4 hours ago', status: 'active', attributes: ['engagement_score', 'churn_probability'] },
  { id: 'seg-5', name: 'Mobile Power Users', description: 'Heavy mobile app users with 10+ sessions/week', audienceSize: 67892, parentSegmentName: 'App Users', lastUpdated: '6 hours ago', status: 'active', attributes: ['session_count', 'device_type'] },
];

const generateMockPerformance = (segments: CDPSegment[]): SegmentPerformance[] => {
  return segments.map(segment => {
    const matchRate = 0.4 + Math.random() * 0.5;
    const matchedUsers = Math.floor(segment.audienceSize * matchRate);
    const impressions = matchedUsers * (5 + Math.floor(Math.random() * 10));
    const ctr = 0.01 + Math.random() * 0.04;
    const clicks = Math.floor(impressions * ctr);
    const cvr = 0.02 + Math.random() * 0.08;
    const conversions = Math.floor(clicks * cvr);
    const spend = impressions * (0.005 + Math.random() * 0.015);
    const revenue = conversions * (50 + Math.random() * 150);
    return { segmentId: segment.id, segmentName: segment.name, audienceSize: segment.audienceSize, matchedUsers, matchRate, impressions, clicks, conversions, spend, revenue, ctr: ctr * 100, cvr: cvr * 100, cpa: spend / conversions, roas: revenue / spend };
  });
};

const generateMockOverlaps = (segments: CDPSegment[]): SegmentOverlap[] => {
  const overlaps: SegmentOverlap[] = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (Math.random() > 0.4) {
        const p1 = 0.05 + Math.random() * 0.35;
        const p2 = 0.05 + Math.random() * 0.35;
        const size = Math.floor(Math.min(segments[i].audienceSize * p1, segments[j].audienceSize * p2));
        overlaps.push({ segment1Name: segments[i].name, segment2Name: segments[j].name, overlapSize: size, overlapPercentage1: p1 * 100, overlapPercentage2: p2 * 100 });
      }
    }
  }
  return overlaps.sort((a, b) => b.overlapSize - a.overlapSize);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

const formatCurrency = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);

export default function CDPSegmentIntegration({ campaignId, onSegmentSelect, onAskAI }: CDPSegmentIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'performance' | 'overlap'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const segments = useMemo(() => generateMockSegments(), []);
  const performance = useMemo(() => generateMockPerformance(segments), [segments]);
  const overlaps = useMemo(() => generateMockOverlaps(segments), [segments]);

  const filteredSegments = useMemo(() => {
    if (!searchQuery) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }, [segments, searchQuery]);

  const overlapChartData = useMemo(() => segments.slice(0, 5).map(s => ({
    name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name, size: s.audienceSize,
  })), [segments]);

  const handleSegmentToggle = useCallback((segmentId: string) => {
    setSelectedSegments(prev => prev.includes(segmentId) ? prev.filter(id => id !== segmentId) : [...prev, segmentId]);
    onSegmentSelect?.(segmentId);
  }, [onSegmentSelect]);

  const handleRefresh = useCallback(() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1500); }, []);

  const bestSegment = useMemo(() => performance.reduce((best, curr) => curr.roas > best.roas ? curr : best), [performance]);

  return (
    <div className="bg-gradient-to-br from-[#131023]/95 to-[#252D6E]/90 rounded-2xl p-6 border border-white/10 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Users size={20} color="white" />
          </div>
          <h2 className="text-xl font-bold text-white">CDP Segment Integration</h2>
        </div>
        <div className="flex gap-2 bg-black/20 p-1 rounded-xl">
          {[{ key: 'browse', icon: <Target size={14} />, label: 'Browse' }, { key: 'performance', icon: <BarChart3 size={14} />, label: 'Performance' }, { key: 'overlap', icon: <Layers size={14} />, label: 'Overlap' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'text-white bg-violet-500/30' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          <div className="flex gap-3 mb-5">
            <div className="flex-1 flex items-center gap-2.5 bg-black/30 border border-white/10 rounded-lg px-3.5 py-2.5">
              <Search size={18} className="text-white/40" />
              <input type="text" placeholder="Search segments by name or description..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/40" />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"><Filter size={16} /> Filter</button>
            <button onClick={handleRefresh} className="flex items-center gap-1.5 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white/70 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh</button>
          </div>

          {filteredSegments.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 mb-6">
              {filteredSegments.map(segment => (
                <div key={segment.id} onClick={() => handleSegmentToggle(segment.id)}
                  className={`bg-black/30 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white/5 hover:-translate-y-0.5 ${selectedSegments.includes(segment.id) ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-violet-500/50'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">{segment.name}</h4>
                      <p className="text-xs text-white/50 leading-snug">{segment.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[11px] font-medium ${segment.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : segment.status === 'building' ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'bg-gray-500/20 text-gray-400'}`}>
                      {segment.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Audience Size', value: formatNumber(segment.audienceSize) },
                      { label: 'Parent Segment', value: segment.parentSegmentName || '-' },
                      { label: 'Last Updated', value: segment.lastUpdated },
                      { label: 'Attributes', value: `${segment.attributes.length} fields` },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div className="text-[11px] text-white/50 mb-0.5">{stat.label}</div>
                        <div className="text-sm font-semibold text-white">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-violet-500/60" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">No segments found</h4>
              <p className="text-sm text-white/50">Try adjusting your search query or filters</p>
            </div>
          )}

          {selectedSegments.length > 0 && (
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shrink-0"><Sparkles size={16} color="white" /></div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-purple-400 mb-1.5">Selected Segments: {selectedSegments.length}</h5>
                <p className="text-sm text-white/80 leading-relaxed">
                  You've selected {formatNumber(segments.filter(s => selectedSegments.includes(s.id)).reduce((sum, s) => sum + s.audienceSize, 0))} total users across {selectedSegments.length} segments.
                </p>
              </div>
              <button onClick={() => onAskAI?.(`Analyze the overlap between selected segments`)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg text-white text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/40 transition-all shrink-0">
                <Sparkles size={14} /> Analyze
              </button>
            </div>
          )}
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <>
          <div className="bg-black/20 rounded-xl overflow-hidden border border-white/10">
            <div className="grid grid-cols-[2fr_repeat(7,1fr)] px-4 py-3 bg-black/30 border-b border-white/10 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              <span>Segment</span><span>Matched</span><span>Impressions</span><span>Clicks</span><span>Conversions</span><span>Spend</span><span>Revenue</span><span>ROAS</span>
            </div>
            {performance.map(p => (
              <div key={p.segmentId} className="grid grid-cols-[2fr_repeat(7,1fr)] px-4 py-3.5 border-b border-white/5 last:border-b-0 items-center hover:bg-white/5 transition-colors text-sm text-white">
                <span className="font-medium">{p.segmentName}</span>
                <span>{formatNumber(p.matchedUsers)} <span className="text-[11px] text-white/50 ml-1">({(p.matchRate * 100).toFixed(0)}%)</span></span>
                <span>{formatNumber(p.impressions)}</span>
                <span>{formatNumber(p.clicks)}</span>
                <span>{formatNumber(p.conversions)}</span>
                <span>{formatCurrency(p.spend)}</span>
                <span>{formatCurrency(p.revenue)}</span>
                <span className={`flex items-center gap-1.5 ${p.roas >= 3 ? 'text-emerald-500' : p.roas < 1 ? 'text-red-500' : ''}`}>
                  {p.roas.toFixed(2)}x
                  {p.roas >= 3 && <TrendingUp size={14} />}
                  {p.roas < 1 && <TrendingDown size={14} />}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-4 mt-5 flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shrink-0"><Sparkles size={16} color="white" /></div>
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-purple-400 mb-1.5">AI Insight: Top Performing Segment</h5>
              <p className="text-sm text-white/80 leading-relaxed">
                <strong>{bestSegment.segmentName}</strong> is your best performing segment with a {bestSegment.roas.toFixed(2)}x ROAS and {formatNumber(bestSegment.conversions)} conversions.
                Consider increasing budget allocation to this segment.
              </p>
            </div>
            <button onClick={() => onAskAI?.(`How can I optimize campaigns for the ${bestSegment.segmentName} segment?`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg text-white text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/40 transition-all shrink-0">
              <Sparkles size={14} /> Optimize
            </button>
          </div>
        </>
      )}

      {/* Overlap Tab */}
      {activeTab === 'overlap' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-black/20 rounded-xl p-5 border border-white/10">
            <h4 className="text-sm font-semibold text-white mb-4">Segment Size Distribution</h4>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie data={overlapChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="size">
                  {overlapChartData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(19,16,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(value: number | undefined) => [formatNumber(value ?? 0), 'Users']} />
                <Legend formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{value}</span>} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          <div className="bg-black/20 rounded-xl p-5 border border-white/10">
            <h4 className="text-sm font-semibold text-white mb-4">Segment Overlaps</h4>
            {overlaps.slice(0, 5).map((overlap, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-3 bg-black/20 rounded-lg mb-2 last:mb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                    <span>{overlap.segment1Name}</span>
                    <ArrowRight size={14} className="text-white/40" />
                    <span>{overlap.segment2Name}</span>
                  </div>
                  <div className="text-xs text-white/50">
                    {formatNumber(overlap.overlapSize)} users overlap ({overlap.overlapPercentage1.toFixed(1)}% / {overlap.overlapPercentage2.toFixed(1)}%)
                  </div>
                </div>
                <div className="text-lg font-bold text-violet-500">
                  {((overlap.overlapPercentage1 + overlap.overlapPercentage2) / 2).toFixed(0)}%
                </div>
              </div>
            ))}
            {overlaps.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Layers size={32} className="text-violet-500/60" /></div>
                <h4 className="text-base font-semibold text-white mb-2">No overlaps detected</h4>
                <p className="text-sm text-white/50">Your segments appear to be distinct</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

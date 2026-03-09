import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AttributionData, AttributionModel, AttributionPath, AttributionInsight } from '../../types/ai-features';

interface CrossChannelAttributionPanelProps {
  onClose?: () => void;
  onAskAI?: (question: string) => void;
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const modelLabels: Record<AttributionModel, { label: string; description: string }> = {
  first_touch: { label: 'First Touch', description: 'Credits the first interaction' },
  last_touch: { label: 'Last Touch', description: 'Credits the final interaction' },
  linear: { label: 'Linear', description: 'Equal credit to all touchpoints' },
  time_decay: { label: 'Time Decay', description: 'More credit to recent touchpoints' },
  position_based: { label: 'Position Based', description: '40% first, 40% last, 20% middle' },
  data_driven: { label: 'Data Driven', description: 'AI-optimized attribution' },
};

const generateAttributionData = (): AttributionData[] => {
  const channels = ['Paid Search', 'Social Ads', 'Display', 'Email', 'Direct'];
  return channels.map((channel, idx) => {
    const base = 100 + Math.random() * 200;
    const v = () => Math.random() * 30 - 15;
    return {
      channel, touchpoints: Math.floor(1000 + Math.random() * 9000),
      firstTouch: base + v(), lastTouch: base + v(), linear: base + v(),
      timeDecay: base + v(), positionBased: base + v(), dataDriven: base + v() + (idx === 0 ? 20 : 0),
      assistedConversions: Math.floor(50 + Math.random() * 450),
      directConversions: Math.floor(30 + Math.random() * 270),
      revenue: Math.floor(10000 + Math.random() * 90000),
      color: COLORS[idx % COLORS.length],
    };
  });
};

const generatePaths = (): AttributionPath[] => {
  return [
    { path: ['Paid Search', 'Email', 'Direct'], pathString: 'Paid Search -> Email -> Direct', conversions: Math.floor(50 + Math.random() * 200), revenue: Math.floor(5000 + Math.random() * 45000), avgTouchpoints: 3, avgDaysToConvert: Math.floor(3 + Math.random() * 12) },
    { path: ['Social Ads', 'Display', 'Paid Search'], pathString: 'Social Ads -> Display -> Paid Search', conversions: Math.floor(50 + Math.random() * 200), revenue: Math.floor(5000 + Math.random() * 45000), avgTouchpoints: 3, avgDaysToConvert: Math.floor(3 + Math.random() * 12) },
    { path: ['Display', 'Social Ads', 'Email'], pathString: 'Display -> Social Ads -> Email', conversions: Math.floor(50 + Math.random() * 200), revenue: Math.floor(5000 + Math.random() * 45000), avgTouchpoints: 3, avgDaysToConvert: Math.floor(3 + Math.random() * 12) },
  ].sort((a, b) => b.conversions - a.conversions);
};

const generateInsights = (): AttributionInsight[] => [
  { channel: 'Paid Search', insight: 'Paid Search shows 23% higher contribution in data-driven model vs last-touch.', recommendation: 'Consider increasing upper-funnel investment in Paid Search.' },
  { channel: 'Email', insight: 'Email is significantly undervalued in first-touch model but shows strong mid-funnel influence.', recommendation: 'Optimize email sequences for conversion assist.' },
  { channel: 'Social Ads', insight: 'Social Ads drive 45% of first-touch conversions but only 12% of last-touch.', recommendation: 'Use Social Ads for awareness, retarget with Display/Email for conversion.' },
];

// Icons
const GitBranchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CrossChannelAttributionPanel: React.FC<CrossChannelAttributionPanelProps> = ({ onClose, onAskAI }) => {
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('data_driven');
  const [viewMode, setViewMode] = useState<'overview' | 'paths' | 'compare'>('overview');
  const [attributionData] = useState<AttributionData[]>(() => generateAttributionData());
  const [paths] = useState<AttributionPath[]>(() => generatePaths());
  const [insights] = useState<AttributionInsight[]>(() => generateInsights());

  const chartData = useMemo(() => {
    const modelKey = selectedModel === 'first_touch' ? 'firstTouch' : selectedModel === 'last_touch' ? 'lastTouch' : selectedModel === 'time_decay' ? 'timeDecay' : selectedModel === 'position_based' ? 'positionBased' : selectedModel === 'data_driven' ? 'dataDriven' : 'linear';
    return attributionData.map(d => ({
      channel: d.channel, value: d[modelKey as keyof AttributionData] as number,
      color: d.color, revenue: d.revenue, touchpoints: d.touchpoints,
    })).sort((a, b) => b.value - a.value);
  }, [attributionData, selectedModel]);

  const totalConversions = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

  const pieData = useMemo(() => chartData.map(d => ({ name: d.channel, value: d.value, color: d.color })), [chartData]);

  return (
    <div className="bg-white/95 rounded-2xl border border-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranchIcon />
          <div>
            <h3 className="text-lg font-semibold">Cross-Channel Attribution</h3>
            <p className="text-sm opacity-90">Understand your conversion paths</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 px-6 py-3 bg-gray-50 border-b border-gray-200">
        {(['overview', 'paths', 'compare'] as const).map(view => (
          <button key={view} onClick={() => setViewMode(view)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              viewMode === view ? 'bg-white text-indigo-500 shadow-sm' : 'text-gray-500 hover:text-indigo-500'
            }`}>
            {view === 'compare' ? 'Compare Models' : view}
          </button>
        ))}
      </div>

      <div className="p-6">
        {viewMode === 'overview' && (
          <>
            {/* Model Selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Attribution Model</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(modelLabels) as AttributionModel[]).map(model => (
                  <button key={model} onClick={() => setSelectedModel(model)} title={modelLabels[model].description}
                    className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedModel === model ? 'border-indigo-500 bg-indigo-50 text-indigo-500' : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-400'
                    }`}>
                    {modelLabels[model].label}
                    {model === 'data_driven' && <span className="ml-1.5 bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold">AI</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Attributed Conversions</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis type="category" dataKey="channel" tick={{ fontSize: 11, fill: '#1E293B' }} width={80} />
                      <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px' }} formatter={(value: number | undefined) => [(value ?? 0).toFixed(0), 'Conversions']} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">Channel Share</h4>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number | undefined) => [`${(((value ?? 0) / totalConversions) * 100).toFixed(1)}%`, 'Share']} />
                      <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[11px] text-gray-500">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <SparkleIcon />
                <h4 className="text-sm font-semibold text-indigo-600">AI Attribution Insights</h4>
              </div>
              <div className="flex flex-col gap-3">
                {insights.map((insight, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3">
                    <div className="text-xs font-semibold text-indigo-500 mb-1">{insight.channel}</div>
                    <p className="text-sm text-gray-800 leading-snug mb-1.5">{insight.insight}</p>
                    <p className="text-xs text-gray-500 italic">{insight.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {viewMode === 'paths' && (
          <>
            <h4 className="text-sm font-semibold text-gray-800 mb-4">Top Conversion Paths</h4>
            <div className="flex flex-col gap-3">
              {paths.map((path, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    {path.path.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ background: `${COLORS[stepIdx % COLORS.length]}15`, color: COLORS[stepIdx % COLORS.length] }}>{step}</span>
                        {stepIdx < path.path.length - 1 && <ArrowRightIcon />}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-6 text-xs">
                    <div><span className="text-gray-400">Conversions: </span><span className="font-semibold text-gray-800">{path.conversions}</span></div>
                    <div><span className="text-gray-400">Revenue: </span><span className="font-semibold text-emerald-500">${path.revenue.toLocaleString()}</span></div>
                    <div><span className="text-gray-400">Avg. Days: </span><span className="font-medium text-gray-800">{path.avgDaysToConvert}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {viewMode === 'compare' && (
          <>
            <h4 className="text-sm font-semibold text-gray-800 mb-4">Model Comparison by Channel</h4>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_repeat(6,80px)] bg-gray-100 px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">
                <div>Channel</div>
                <div className="text-center">First</div><div className="text-center">Last</div><div className="text-center">Linear</div>
                <div className="text-center">Decay</div><div className="text-center">Position</div><div className="text-center text-indigo-500">AI</div>
              </div>
              {attributionData.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_repeat(6,80px)] px-4 py-3 border-b border-gray-200 last:border-b-0 text-xs hover:bg-gray-50/80">
                  <div className="font-medium text-gray-800">{row.channel}</div>
                  <div className="text-center text-gray-500">{row.firstTouch.toFixed(0)}</div>
                  <div className="text-center text-gray-500">{row.lastTouch.toFixed(0)}</div>
                  <div className="text-center text-gray-500">{row.linear.toFixed(0)}</div>
                  <div className="text-center text-gray-500">{row.timeDecay.toFixed(0)}</div>
                  <div className="text-center text-gray-500">{row.positionBased.toFixed(0)}</div>
                  <div className="text-center font-semibold text-indigo-500">{row.dataDriven.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {onAskAI && (
          <button onClick={() => onAskAI('Analyze my cross-channel attribution data and provide recommendations for optimizing my marketing mix.')}
            className="w-full mt-4 py-3.5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
            <SparkleIcon /> Get AI Attribution Analysis
          </button>
        )}
      </div>
    </div>
  );
};

export default CrossChannelAttributionPanel;

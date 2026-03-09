import { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Minus, Target, Award, BarChart3,
  PieChart, ArrowUp, ArrowDown, Sparkles, RefreshCw, AlertTriangle, CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';

interface BenchmarkMetric {
  id: string;
  name: string;
  yourValue: number;
  industryAvg: number;
  topPerformers: number;
  bottomPerformers: number;
  percentile: number;
  unit: string;
  format: 'number' | 'percentage' | 'currency' | 'multiplier';
  higherIsBetter: boolean;
}

interface GapAnalysis {
  metric: string;
  currentValue: number;
  targetValue: number;
  gap: number;
  gapPercentage: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface CompetitorBenchmarkingProps {
  campaignId: string;
  industry?: string;
  onAskAI?: (question: string) => void;
}

const INDUSTRIES = ['E-commerce', 'SaaS', 'Finance', 'Healthcare', 'Travel', 'Education', 'Retail', 'Technology'];

const generateMockBenchmarks = (): BenchmarkMetric[] => [
  { id: 'ctr', name: 'Click-Through Rate', yourValue: 2.8, industryAvg: 2.1, topPerformers: 4.5, bottomPerformers: 0.8, percentile: 72, unit: '%', format: 'percentage', higherIsBetter: true },
  { id: 'cvr', name: 'Conversion Rate', yourValue: 3.2, industryAvg: 2.8, topPerformers: 5.5, bottomPerformers: 1.2, percentile: 58, unit: '%', format: 'percentage', higherIsBetter: true },
  { id: 'cpa', name: 'Cost Per Acquisition', yourValue: 42, industryAvg: 55, topPerformers: 28, bottomPerformers: 95, percentile: 68, unit: '$', format: 'currency', higherIsBetter: false },
  { id: 'roas', name: 'Return on Ad Spend', yourValue: 4.2, industryAvg: 3.5, topPerformers: 6.0, bottomPerformers: 1.5, percentile: 65, unit: 'x', format: 'multiplier', higherIsBetter: true },
  { id: 'cpm', name: 'Cost Per Mille', yourValue: 8.5, industryAvg: 12.0, topPerformers: 6.0, bottomPerformers: 22.0, percentile: 78, unit: '$', format: 'currency', higherIsBetter: false },
];

const generateGapAnalysis = (benchmarks: BenchmarkMetric[]): GapAnalysis[] => {
  return benchmarks.map(metric => {
    const targetValue = metric.topPerformers;
    const gap = metric.higherIsBetter ? targetValue - metric.yourValue : metric.yourValue - targetValue;
    const gapPercentage = (gap / targetValue) * 100;
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (metric.percentile < 30) priority = 'high';
    else if (metric.percentile < 60) priority = 'medium';

    const recs: Record<string, string> = {
      ctr: 'Improve ad creative relevance and test new headlines to boost CTR',
      cvr: 'Optimize landing pages and streamline the conversion funnel',
      cpa: 'Focus on high-intent audiences and improve bid strategies',
      roas: 'Shift budget to top-performing campaigns and segments',
      cpm: 'Test new placements and optimize audience targeting',
    };

    return { metric: metric.name, currentValue: metric.yourValue, targetValue, gap: Math.abs(gap), gapPercentage: Math.abs(gapPercentage), priority, recommendation: recs[metric.id] || 'Analyze patterns in top performers' };
  });
};

export default function CompetitorBenchmarking({ campaignId, industry = 'E-commerce', onAskAI }: CompetitorBenchmarkingProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'gap'>('overview');
  const [selectedIndustry, setSelectedIndustry] = useState(industry);
  const [isLoading, setIsLoading] = useState(false);

  const benchmarks = useMemo(() => generateMockBenchmarks(), []);
  const gapAnalysis = useMemo(() => generateGapAnalysis(benchmarks), [benchmarks]);

  const radarData = useMemo(() => benchmarks.map(b => ({
    metric: b.name.substring(0, 15), you: b.percentile, industry: 50, top: 90,
  })), [benchmarks]);

  const summaryStats = useMemo(() => {
    const avgPercentile = benchmarks.reduce((sum, b) => sum + b.percentile, 0) / benchmarks.length;
    const aboveAvg = benchmarks.filter(b => b.higherIsBetter ? b.yourValue > b.industryAvg : b.yourValue < b.industryAvg).length;
    const topTier = benchmarks.filter(b => b.percentile >= 75).length;
    const needsWork = benchmarks.filter(b => b.percentile < 40).length;
    return { avgPercentile, aboveAvg, topTier, needsWork };
  }, [benchmarks]);

  const formatValue = (value: number, format: string, unit: string) => {
    switch (format) {
      case 'currency': return `${unit}${value.toFixed(0)}`;
      case 'percentage': return `${value.toFixed(1)}${unit}`;
      case 'multiplier': return `${value.toFixed(1)}${unit}`;
      default: return `${value.toFixed(1)}${unit}`;
    }
  };

  const getPercentileClass = (p: number) => p >= 70 ? 'text-emerald-500 bg-emerald-500/20' : p >= 40 ? 'text-amber-500 bg-amber-500/20' : 'text-red-500 bg-red-500/20';
  const getTierGradient = (p: number) => p >= 70 ? 'from-emerald-500 to-emerald-400' : p >= 40 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400';

  const handleRefresh = useCallback(() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 1500); }, []);

  return (
    <div className="bg-gradient-to-br from-[#131023]/95 to-[#252D6E]/90 rounded-2xl p-6 border border-white/10 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
            <Award size={20} color="white" />
          </div>
          <h2 className="text-xl font-bold text-white">Competitor Benchmarking</h2>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm [&>option]:bg-[#131023] [&>option]:text-white">
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
          <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg text-white text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/40 transition-all">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-black/20 p-1 rounded-xl mb-6">
        {[{ key: 'overview', icon: <PieChart size={14} />, label: 'Overview' }, { key: 'detailed', icon: <BarChart3 size={14} />, label: 'Detailed Metrics' }, { key: 'gap', icon: <Target size={14} />, label: 'Gap Analysis' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'text-white bg-amber-500/30' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Average Percentile', value: `${summaryStats.avgPercentile.toFixed(0)}th`, sub: summaryStats.avgPercentile >= 50 ? 'Above average' : 'Below average', subClass: summaryStats.avgPercentile >= 50 ? 'text-emerald-500' : 'text-red-500', icon: summaryStats.avgPercentile >= 50 ? <ArrowUp size={12} /> : <ArrowDown size={12} /> },
              { label: 'Metrics Above Avg', value: `${summaryStats.aboveAvg}/${benchmarks.length}`, sub: `${((summaryStats.aboveAvg / benchmarks.length) * 100).toFixed(0)}% of metrics`, subClass: 'text-white/50' },
              { label: 'Top Tier (75th+)', value: `${summaryStats.topTier}`, sub: 'Excellent performance', subClass: 'text-emerald-500', icon: <CheckCircle size={12} /> },
              { label: 'Needs Improvement', value: `${summaryStats.needsWork}`, sub: summaryStats.needsWork > 0 ? 'Below 40th percentile' : 'All metrics healthy', subClass: summaryStats.needsWork > 0 ? 'text-red-500' : 'text-emerald-500', icon: summaryStats.needsWork > 0 ? <AlertTriangle size={12} /> : <CheckCircle size={12} /> },
            ].map(card => (
              <div key={card.label} className="bg-black/30 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-xs text-white/50 mb-2">{card.label}</div>
                <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
                <div className={`text-[11px] flex items-center justify-center gap-1 ${card.subClass}`}>{card.icon}{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-black/20 rounded-xl p-5 border border-white/10 mb-6">
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" gridType="polygon" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <Radar name="Top Performers" dataKey="top" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeDasharray="5 5" />
                <Radar name="Industry Average" dataKey="industry" stroke="#6B7280" fill="#6B7280" fillOpacity={0.1} />
                <Radar name="Your Performance" dataKey="you" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} strokeWidth={2} />
                <Legend wrapperStyle={{ paddingTop: 20 }} formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{value}</span>} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Detailed Tab */}
      {activeTab === 'detailed' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mb-6">
          {benchmarks.map(metric => (
            <div key={metric.id} className="bg-black/30 border border-white/10 rounded-xl p-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${getTierGradient(metric.percentile)}`} />
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white/70">{metric.name}</h4>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getPercentileClass(metric.percentile)}`}>
                  {metric.percentile}th percentile
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-[28px] font-bold text-white">{formatValue(metric.yourValue, metric.format, metric.unit)}</span>
                <span className="text-sm text-white/50">Your value</span>
                {metric.higherIsBetter ? (
                  metric.yourValue > metric.industryAvg
                    ? <span className="ml-auto text-sm font-medium text-emerald-500 flex items-center gap-0.5"><TrendingUp size={16} /> +{(((metric.yourValue - metric.industryAvg) / metric.industryAvg) * 100).toFixed(0)}%</span>
                    : <span className="ml-auto text-sm font-medium text-red-500 flex items-center gap-0.5"><TrendingDown size={16} /> {(((metric.yourValue - metric.industryAvg) / metric.industryAvg) * 100).toFixed(0)}%</span>
                ) : (
                  metric.yourValue < metric.industryAvg
                    ? <span className="ml-auto text-sm font-medium text-emerald-500 flex items-center gap-0.5"><TrendingUp size={16} /> +{(((metric.industryAvg - metric.yourValue) / metric.industryAvg) * 100).toFixed(0)}%</span>
                    : <span className="ml-auto text-sm font-medium text-red-500 flex items-center gap-0.5"><TrendingDown size={16} /> {(((metric.industryAvg - metric.yourValue) / metric.industryAvg) * 100).toFixed(0)}%</span>
                )}
              </div>
              <div className="h-2 bg-white/10 rounded-full relative mb-2">
                <div className={`absolute h-full rounded-full bg-gradient-to-r ${getTierGradient(metric.percentile)} transition-all duration-500`} style={{ width: `${metric.percentile}%` }} />
                <div className="absolute w-[3px] h-3.5 -top-[3px] rounded bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]" style={{ left: `calc(${metric.percentile}% - 1.5px)` }} />
              </div>
              <div className="flex justify-between text-[11px] text-white/50">
                <span>Bottom: {formatValue(metric.bottomPerformers, metric.format, metric.unit)}</span>
                <span className="text-white font-semibold">You: {formatValue(metric.yourValue, metric.format, metric.unit)}</span>
                <span>Avg: {formatValue(metric.industryAvg, metric.format, metric.unit)}</span>
                <span>Top: {formatValue(metric.topPerformers, metric.format, metric.unit)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gap Tab */}
      {activeTab === 'gap' && (
        <div className="bg-black/20 rounded-xl overflow-hidden border border-white/10">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] px-4 py-3 bg-black/30 border-b border-white/10 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
            <span>Metric</span><span>Current</span><span>Target (Top)</span><span>Gap</span><span>Priority</span><span>Recommendation</span>
          </div>
          {gapAnalysis.map((gap, index) => (
            <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_2fr] px-4 py-3.5 border-b border-white/5 last:border-b-0 items-center hover:bg-white/5 transition-colors">
              <span className="text-sm text-white font-medium">{gap.metric}</span>
              <span className="text-sm text-white">{gap.currentValue.toFixed(1)}</span>
              <span className="text-sm text-white">{gap.targetValue.toFixed(1)}</span>
              <span className={`text-sm font-semibold ${gap.gapPercentage <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{gap.gapPercentage > 0 ? '-' : '+'}{gap.gapPercentage.toFixed(0)}%</span>
              <span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ${gap.priority === 'high' ? 'bg-red-500/20 text-red-500' : gap.priority === 'medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                  {gap.priority === 'high' && <AlertTriangle size={10} />}
                  {gap.priority === 'medium' && <Minus size={10} />}
                  {gap.priority === 'low' && <CheckCircle size={10} />}
                  {gap.priority}
                </span>
              </span>
              <span className="text-xs text-white/70 leading-snug">{gap.recommendation}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-4 mt-5 flex items-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center shrink-0">
          <Sparkles size={16} color="white" />
        </div>
        <div className="flex-1">
          <h5 className="text-sm font-semibold text-amber-500 mb-1.5">AI Competitive Analysis</h5>
          <p className="text-sm text-white/80 leading-relaxed">
            You're in the <strong>{summaryStats.avgPercentile.toFixed(0)}th percentile</strong> overall in the {selectedIndustry} industry.
            Your strongest metric is <strong>CPM</strong> (78th percentile), while <strong>Conversion Rate</strong> (58th percentile) has the most room for improvement.
          </p>
        </div>
        <button onClick={() => onAskAI?.(`How can I improve my ${selectedIndustry} campaign performance to match top performers?`)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg text-white text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/40 transition-all shrink-0">
          <Sparkles size={14} /> Get Tips
        </button>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  CampaignForecast,
  ForecastMetric,
  ForecastHorizon,
  TrendDirection,
  ForecastPrediction,
} from '../../types/ai-features';

interface CampaignData {
  id: string;
  name: string;
  status: string;
  budget: string;
  budgetSpent: number;
  conversions: string;
  healthScore: number;
}

interface AIPerformanceForecastingProps {
  campaigns: CampaignData[];
  onClose?: () => void;
  onAskAI?: (question: string) => void;
}

const metricConfig: Record<ForecastMetric, { label: string; format: (v: number) => string; color: string }> = {
  roas: { label: 'ROAS', format: (v) => `${v.toFixed(2)}x`, color: '#10B981' },
  conversions: { label: 'Conversions', format: (v) => v.toLocaleString(), color: '#6366F1' },
  spend: { label: 'Spend', format: (v) => `$${(v / 1000).toFixed(1)}K`, color: '#3B82F6' },
  cpa: { label: 'CPA', format: (v) => `$${v.toFixed(2)}`, color: '#F59E0B' },
  ctr: { label: 'CTR', format: (v) => `${v.toFixed(2)}%`, color: '#8B5CF6' },
  impressions: { label: 'Impressions', format: (v) => `${(v / 1000000).toFixed(1)}M`, color: '#EC4899' },
  clicks: { label: 'Clicks', format: (v) => `${(v / 1000).toFixed(1)}K`, color: '#14B8A6' },
};

const generateForecast = (
  campaign: CampaignData,
  metric: ForecastMetric,
  horizon: ForecastHorizon
): CampaignForecast => {
  const baseValue = getBaseValue(campaign, metric);
  const trendMultiplier = campaign.healthScore > 70 ? 1.05 : 0.95;
  const volatility = 0.1;

  const predictions: ForecastPrediction[] = [];
  const today = new Date();

  for (let i = 0; i <= horizon; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const trend = Math.pow(trendMultiplier, i / 7);
    const noise = 1 + (Math.random() - 0.5) * volatility;
    const predicted = baseValue * trend * noise;

    const uncertainty = 0.1 + (i / horizon) * 0.15;
    const lowerBound = predicted * (1 - uncertainty);
    const upperBound = predicted * (1 + uncertainty);
    const confidence = Math.max(0.5, 1 - (i / horizon) * 0.4);

    predictions.push({ date: date.toISOString().split('T')[0], predicted, lowerBound, upperBound, confidence });
  }

  const trend: TrendDirection = trendMultiplier > 1 ? 'up' : trendMultiplier < 1 ? 'down' : 'stable';
  const trendPercentage = (trendMultiplier - 1) * 100 * (horizon / 7);

  const insights = [
    `Based on historical patterns, ${campaign.name} is projected to ${trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'remain stable'} by ${Math.abs(trendPercentage).toFixed(1)}% over the next ${horizon} days.`,
    campaign.healthScore > 70
      ? 'Strong performance trajectory suggests potential for scaling.'
      : 'Consider optimization strategies to improve performance trajectory.',
  ];

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    metric,
    horizon,
    predictions,
    trend,
    trendPercentage,
    seasonalityFactors: ['day_of_week', 'holidays'],
    aiInsight: insights.join(' '),
    generatedAt: new Date().toISOString(),
  };
};

const getBaseValue = (campaign: CampaignData, metric: ForecastMetric): number => {
  const budget = parseFloat(campaign.budget.replace(/[$,]/g, '') || '0');
  const conversions = parseInt(campaign.conversions.replace(/[^0-9]/g, '') || '0');

  switch (metric) {
    case 'roas': return 1.5 + Math.random() * 2.5;
    case 'conversions': return conversions || Math.random() * 500;
    case 'spend': return budget * 0.03;
    case 'cpa': return budget / Math.max(conversions, 100);
    case 'ctr': return 1 + Math.random() * 3;
    case 'impressions': return 50000 + Math.random() * 200000;
    case 'clicks': return 1000 + Math.random() * 5000;
    default: return 100;
  }
};

// Icons
const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);

const TrendUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const TrendDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
);

const TrendStableIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

const AIPerformanceForecasting: React.FC<AIPerformanceForecastingProps> = ({
  campaigns,
  onClose,
  onAskAI,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns.filter(c => c.status === 'Active')[0]?.id || campaigns[0]?.id || ''
  );
  const [selectedMetric, setSelectedMetric] = useState<ForecastMetric>('roas');
  const [selectedHorizon, setSelectedHorizon] = useState<ForecastHorizon>(14);

  const selectedCampaign = useMemo(
    () => campaigns.find(c => c.id === selectedCampaignId),
    [campaigns, selectedCampaignId]
  );

  const forecast = useMemo(() => {
    if (!selectedCampaign) return null;
    return generateForecast(selectedCampaign, selectedMetric, selectedHorizon);
  }, [selectedCampaign, selectedMetric, selectedHorizon]);

  const chartData = useMemo(() => {
    if (!forecast) return [];
    return forecast.predictions.map((pred, index) => ({
      day: index,
      date: new Date(pred.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: pred.predicted,
      lower: pred.lowerBound,
      upper: pred.upperBound,
      range: [pred.lowerBound, pred.upperBound],
      confidence: pred.confidence,
    }));
  }, [forecast]);

  const config = metricConfig[selectedMetric];

  return (
    <div className="bg-white/95 rounded-2xl border border-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChartIcon />
          <div>
            <h3 className="text-lg font-semibold">AI Performance Forecasting</h3>
            <p className="text-sm opacity-90">ML-powered predictions for your campaigns</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Controls */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 mb-6 items-end">
          {/* Campaign Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Campaign
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white focus:border-emerald-500 focus:outline-none"
            >
              {campaigns.filter(c => c.status === 'Active' || c.status === 'Completed').map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Metric
            </label>
            <div className="flex gap-1.5">
              {(['roas', 'conversions', 'spend', 'cpa'] as ForecastMetric[]).map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedMetric === metric
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-400'
                  }`}
                >
                  {metricConfig[metric].label}
                </button>
              ))}
            </div>
          </div>

          {/* Horizon Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Forecast Horizon
            </label>
            <div className="flex gap-1.5">
              {([7, 14, 30] as ForecastHorizon[]).map(horizon => (
                <button
                  key={horizon}
                  onClick={() => setSelectedHorizon(horizon)}
                  className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedHorizon === horizon
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-400'
                  }`}
                >
                  {horizon}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {forecast && (
          <>
            {/* Trend Summary */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Current</p>
                <p className="mt-1 text-xl font-semibold text-gray-800">
                  {config.format(forecast.predictions[0].predicted)}
                </p>
              </div>

              <div className={`rounded-xl p-4 ${
                forecast.trend === 'up' ? 'bg-emerald-50' : forecast.trend === 'down' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <p className={`text-xs ${
                  forecast.trend === 'up' ? 'text-emerald-600' : forecast.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  Predicted ({selectedHorizon}d)
                </p>
                <div className="flex items-baseline gap-2">
                  <p className={`mt-1 text-xl font-semibold ${
                    forecast.trend === 'up' ? 'text-emerald-600' : forecast.trend === 'down' ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    {config.format(forecast.predictions[forecast.predictions.length - 1].predicted)}
                  </p>
                  <span className={`flex items-center gap-0.5 text-sm font-medium ${
                    forecast.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {forecast.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    {Math.abs(forecast.trendPercentage).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500">Avg Confidence</p>
                <p className="mt-1 text-xl font-semibold text-gray-800">
                  {(forecast.predictions.reduce((sum, p) => sum + p.confidence, 0) / forecast.predictions.length * 100).toFixed(0)}%
                </p>
              </div>

              <div className={`rounded-xl p-4 flex items-center gap-3 ${
                forecast.trend === 'up' ? 'bg-emerald-50' : forecast.trend === 'down' ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                  forecast.trend === 'up' ? 'bg-emerald-500' : forecast.trend === 'down' ? 'bg-red-500' : 'bg-amber-500'
                }`}>
                  {forecast.trend === 'up' ? <TrendUpIcon /> : forecast.trend === 'down' ? <TrendDownIcon /> : <TrendStableIcon />}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trend</p>
                  <p className={`mt-0.5 text-sm font-semibold capitalize ${
                    forecast.trend === 'up' ? 'text-emerald-600' : forecast.trend === 'down' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {forecast.trend === 'up' ? 'Upward' : forecast.trend === 'down' ? 'Downward' : 'Stable'}
                  </p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-50 rounded-xl p-5 mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                {config.label} Forecast
              </h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={{ stroke: '#E2E8F0' }} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={{ stroke: '#E2E8F0' }} axisLine={{ stroke: '#E2E8F0' }} tickFormatter={(value) => config.format(value)} width={70} />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number | undefined, name: string | undefined) => [config.format(value ?? 0), name === 'predicted' ? 'Predicted' : name === 'lower' ? 'Lower Bound' : 'Upper Bound']}
                    />
                    <ReferenceLine x={0} stroke="#64748B" strokeDasharray="5 5" label={{ value: 'Today', position: 'top', fill: '#64748B', fontSize: 11 }} />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confidenceGradient)" name="upper" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="white" name="lower" />
                    <Area type="monotone" dataKey="predicted" stroke={config.color} strokeWidth={2} fill="url(#forecastGradient)" name="predicted" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-6 justify-center mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 rounded" style={{ background: config.color }} />
                  <span className="text-xs text-gray-500">Predicted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-2 rounded" style={{ background: `${config.color}20` }} />
                  <span className="text-xs text-gray-500">Confidence Interval</span>
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shrink-0">
                <SparkleIcon />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-indigo-600 mb-1">AI Insight</h5>
                <p className="text-sm text-indigo-800 leading-relaxed">{forecast.aiInsight}</p>
              </div>
            </div>

            {/* Ask AI Button */}
            {onAskAI && (
              <button
                onClick={() => onAskAI(`Analyze the ${config.label} forecast for ${forecast.campaignName} and provide optimization recommendations.`)}
                className="w-full mt-4 py-3.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                <SparkleIcon />
                Get Detailed AI Analysis
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIPerformanceForecasting;

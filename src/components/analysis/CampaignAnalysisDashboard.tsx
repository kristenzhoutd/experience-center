import { Calendar, Users, Target, Shield } from 'lucide-react';
import type { CampaignAnalysisOutput } from '../../types/campaignAnalysis';
import AnalysisKpiCard from './AnalysisKpiCard';
import AnalysisInsightsPanel from './AnalysisInsightsPanel';
import ConversionByPageChart from './ConversionByPageChart';
import ConversionBySpotGrid from './ConversionBySpotGrid';
import CtrBreakdownChart from './CtrBreakdownChart';
import ConversionByCreativeTable from './ConversionByCreativeTable';
import SegmentPerformanceTable from './SegmentPerformanceTable';

interface CampaignAnalysisDashboardProps {
  analysis: CampaignAnalysisOutput;
}

import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts';

export default function CampaignAnalysisDashboard({ analysis }: CampaignAnalysisDashboardProps) {
  const { campaign, kpis, aiInsights, conversionByPage, conversionBySpot, ctrBreakdown, conversionByCreative, segmentPerformance, statisticalSignificance, timeSeriesData } = analysis;

  const statusColor: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    paused: 'bg-amber-50 text-amber-700',
    completed: 'bg-blue-50 text-blue-700',
    draft: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-5 px-6 py-6">
      {/* Campaign Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/td-icon.svg" alt="Treasure Data" className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">Campaign Analysis</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{campaign.name}</h2>
          </div>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusColor[campaign.status] || statusColor.draft}`}>
            {campaign.status}
          </span>
        </div>
        <div className="flex items-center gap-5 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{campaign.startDate} — {campaign.endDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span>{campaign.audiences.join(', ')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-gray-400" />
            <span>{campaign.conversionEvent}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards + AI Insights */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <AnalysisKpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </div>
        <div className="col-span-5">
          <AnalysisInsightsPanel summary={aiInsights.summary} suggestions={aiInsights.suggestions} />
        </div>
      </div>

      {/* Time Series Performance Chart */}
      {timeSeriesData && timeSeriesData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Performance Over Time</h3>
            <span className="text-[10px] text-gray-400">Last 30 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#999' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#999' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#999' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
              />
              <RechartsLegend
                wrapperStyle={{ fontSize: '10px' }}
                iconSize={10}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="visitors"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="Visitors"
              />
              <Line
                yAxisId="left"
                dataKey="conversions"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Conversions"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversionRate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Conversion Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Conversion by Page + Conversion by Spot */}
      <div className="grid grid-cols-2 gap-4">
        {conversionByPage.length > 0 && (
          <ConversionByPageChart data={conversionByPage} />
        )}
        {conversionBySpot.length > 0 && (
          <ConversionBySpotGrid data={conversionBySpot} />
        )}
      </div>

      {/* CTR Breakdown + Conversion by Creative */}
      <div className="grid grid-cols-2 gap-4">
        {ctrBreakdown.length > 0 && (
          <CtrBreakdownChart data={ctrBreakdown} />
        )}
        {conversionByCreative.length > 0 && (
          <ConversionByCreativeTable data={conversionByCreative} />
        )}
      </div>

      {/* Segment Performance */}
      {segmentPerformance.length > 0 && (
        <SegmentPerformanceTable data={segmentPerformance} />
      )}

      {/* Statistical Significance Footer */}
      {statisticalSignificance && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Statistical Significance</p>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-gray-600">
            <div>
              <span className="text-gray-400">Confidence: </span>
              <span className="font-semibold">{statisticalSignificance.confidenceLevel}%</span>
            </div>
            <div>
              <span className="text-gray-400">Sample size: </span>
              <span className={`font-semibold ${statisticalSignificance.sampleSizeAdequate ? 'text-green-600' : 'text-amber-600'}`}>
                {statisticalSignificance.sampleSizeAdequate ? 'Adequate' : 'Insufficient'}
              </span>
            </div>
            {statisticalSignificance.daysRemaining > 0 && (
              <div>
                <span className="text-gray-400">Days to significance: </span>
                <span className="font-semibold">{statisticalSignificance.daysRemaining}</span>
              </div>
            )}
          </div>
          {statisticalSignificance.notes && (
            <p className="text-[10px] text-gray-400 mt-1.5">{statisticalSignificance.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

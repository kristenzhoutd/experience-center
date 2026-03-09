import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiData {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  invertTrend?: boolean;
}

interface ContentSpot {
  name: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface Segment {
  name: string;
  visitors: number;
  convRate: number;
  engagementScore: number;
}

interface Creative {
  name: string;
  type: string;
  impressions: number;
  ctr: number;
  status: 'Active' | 'Paused' | 'Draft';
}

interface PageData {
  kpis: KpiData[];
  spots: ContentSpot[];
  segments: Segment[];
  creatives: Creative[];
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const PAGE_OPTIONS = [
  { value: '/homepage', label: 'Homepage' },
  { value: '/products', label: 'Products' },
  { value: '/pricing', label: 'Pricing' },
  { value: '/blog', label: 'Blog' },
  { value: '/features', label: 'Features' },
];

const PAGES: Record<string, PageData> = {
  '/homepage': {
    kpis: [
      { label: 'Visitors', value: '48,291', trend: 'up', trendValue: '+12.4%' },
      { label: 'Conversions', value: '3,847', trend: 'up', trendValue: '+8.2%' },
      { label: 'Conv Rate', value: '7.97%', trend: 'up', trendValue: '+0.6pp' },
      { label: 'Bounce Rate', value: '34.2%', trend: 'down', trendValue: '-2.1pp', invertTrend: true },
    ],
    spots: [
      { name: 'Hero Banner', impressions: 45_120, clicks: 3_610, ctr: 8.0 },
      { name: 'Featured Products', impressions: 38_400, clicks: 2_304, ctr: 6.0 },
      { name: 'Social Proof Bar', impressions: 42_800, clicks: 1_712, ctr: 4.0 },
      { name: 'Exit-Intent Modal', impressions: 12_600, clicks: 1_134, ctr: 9.0 },
    ],
    segments: [
      { name: 'New Visitors', visitors: 28_450, convRate: 5.3, engagementScore: 62 },
      { name: 'Returning Customers', visitors: 14_210, convRate: 12.1, engagementScore: 84 },
      { name: 'High-Intent Browsers', visitors: 5_631, convRate: 18.7, engagementScore: 91 },
    ],
    creatives: [
      { name: 'Spring Sale Banner', type: 'Image', impressions: 22_340, ctr: 7.8, status: 'Active' },
      { name: 'Welcome Video', type: 'Video', impressions: 18_900, ctr: 5.2, status: 'Active' },
      { name: 'Product Carousel v2', type: 'HTML', impressions: 15_100, ctr: 6.4, status: 'Paused' },
      { name: 'Loyalty CTA', type: 'Image', impressions: 0, ctr: 0, status: 'Draft' },
    ],
  },
  '/products': {
    kpis: [
      { label: 'Visitors', value: '31,672', trend: 'up', trendValue: '+5.8%' },
      { label: 'Conversions', value: '2,218', trend: 'down', trendValue: '-3.1%' },
      { label: 'Conv Rate', value: '7.00%', trend: 'down', trendValue: '-0.7pp' },
      { label: 'Bounce Rate', value: '41.5%', trend: 'up', trendValue: '+1.3pp', invertTrend: true },
    ],
    spots: [
      { name: 'Category Header', impressions: 30_200, clicks: 2_114, ctr: 7.0 },
      { name: 'Cross-Sell Widget', impressions: 24_500, clicks: 1_470, ctr: 6.0 },
      { name: 'Recently Viewed', impressions: 19_800, clicks: 1_386, ctr: 7.0 },
      { name: 'Review Highlights', impressions: 26_100, clicks: 1_044, ctr: 4.0 },
    ],
    segments: [
      { name: 'Category Browsers', visitors: 18_200, convRate: 6.2, engagementScore: 58 },
      { name: 'Cart Abandoners', visitors: 8_430, convRate: 9.8, engagementScore: 72 },
      { name: 'Comparison Shoppers', visitors: 5_042, convRate: 11.4, engagementScore: 79 },
    ],
    creatives: [
      { name: 'Best-Seller Badge', type: 'HTML', impressions: 28_100, ctr: 5.9, status: 'Active' },
      { name: 'Bundle Offer Card', type: 'Image', impressions: 14_600, ctr: 8.3, status: 'Active' },
      { name: 'Size Guide Popup', type: 'HTML', impressions: 9_800, ctr: 3.1, status: 'Paused' },
      { name: 'AR Try-On CTA', type: 'Image', impressions: 0, ctr: 0, status: 'Draft' },
    ],
  },
  '/pricing': {
    kpis: [
      { label: 'Visitors', value: '14,508', trend: 'up', trendValue: '+18.2%' },
      { label: 'Conversions', value: '1,886', trend: 'up', trendValue: '+14.6%' },
      { label: 'Conv Rate', value: '13.00%', trend: 'up', trendValue: '+1.2pp' },
      { label: 'Bounce Rate', value: '22.8%', trend: 'down', trendValue: '-4.3pp', invertTrend: true },
    ],
    spots: [
      { name: 'Plan Comparison', impressions: 14_100, clicks: 2_538, ctr: 18.0 },
      { name: 'Enterprise CTA', impressions: 6_200, clicks: 806, ctr: 13.0 },
      { name: 'FAQ Accordion', impressions: 11_800, clicks: 708, ctr: 6.0 },
      { name: 'Trust Badges', impressions: 13_900, clicks: 556, ctr: 4.0 },
    ],
    segments: [
      { name: 'Trial Users', visitors: 7_240, convRate: 16.4, engagementScore: 88 },
      { name: 'Enterprise Leads', visitors: 3_810, convRate: 11.2, engagementScore: 82 },
      { name: 'Price-Sensitive', visitors: 3_458, convRate: 8.6, engagementScore: 65 },
    ],
    creatives: [
      { name: 'Annual Discount Badge', type: 'HTML', impressions: 13_200, ctr: 14.2, status: 'Active' },
      { name: 'Comparison Table v3', type: 'HTML', impressions: 14_100, ctr: 11.8, status: 'Active' },
      { name: 'Free Trial Banner', type: 'Image', impressions: 8_400, ctr: 9.6, status: 'Active' },
      { name: 'ROI Calculator', type: 'HTML', impressions: 4_100, ctr: 7.2, status: 'Paused' },
    ],
  },
  '/blog': {
    kpis: [
      { label: 'Visitors', value: '22,140', trend: 'neutral', trendValue: '+0.3%' },
      { label: 'Conversions', value: '886', trend: 'down', trendValue: '-5.4%' },
      { label: 'Conv Rate', value: '4.00%', trend: 'down', trendValue: '-0.3pp' },
      { label: 'Bounce Rate', value: '52.1%', trend: 'up', trendValue: '+2.8pp', invertTrend: true },
    ],
    spots: [
      { name: 'Inline CTA', impressions: 18_300, clicks: 1_281, ctr: 7.0 },
      { name: 'Related Posts', impressions: 16_400, clicks: 1_804, ctr: 11.0 },
      { name: 'Newsletter Signup', impressions: 20_100, clicks: 804, ctr: 4.0 },
      { name: 'Content Gate', impressions: 5_600, clicks: 504, ctr: 9.0 },
    ],
    segments: [
      { name: 'Organic Search', visitors: 14_800, convRate: 3.1, engagementScore: 54 },
      { name: 'Email Subscribers', visitors: 4_920, convRate: 7.8, engagementScore: 76 },
      { name: 'Social Referrals', visitors: 2_420, convRate: 2.4, engagementScore: 41 },
    ],
    creatives: [
      { name: 'Ebook Download CTA', type: 'Image', impressions: 16_200, ctr: 5.4, status: 'Active' },
      { name: 'Webinar Promo', type: 'Image', impressions: 11_800, ctr: 3.8, status: 'Paused' },
      { name: 'Author Bio Card', type: 'HTML', impressions: 18_300, ctr: 2.1, status: 'Active' },
      { name: 'Podcast Embed', type: 'HTML', impressions: 0, ctr: 0, status: 'Draft' },
    ],
  },
  '/features': {
    kpis: [
      { label: 'Visitors', value: '19,834', trend: 'up', trendValue: '+9.1%' },
      { label: 'Conversions', value: '1,587', trend: 'up', trendValue: '+6.7%' },
      { label: 'Conv Rate', value: '8.00%', trend: 'neutral', trendValue: '+0.1pp' },
      { label: 'Bounce Rate', value: '29.4%', trend: 'down', trendValue: '-1.8pp', invertTrend: true },
    ],
    spots: [
      { name: 'Feature Highlights', impressions: 19_200, clicks: 2_304, ctr: 12.0 },
      { name: 'Demo Request Form', impressions: 8_400, clicks: 1_176, ctr: 14.0 },
      { name: 'Integration Logos', impressions: 17_600, clicks: 704, ctr: 4.0 },
      { name: 'Use Case Tabs', impressions: 15_100, clicks: 1_510, ctr: 10.0 },
    ],
    segments: [
      { name: 'Evaluators', visitors: 10_240, convRate: 9.4, engagementScore: 78 },
      { name: 'Technical Buyers', visitors: 5_870, convRate: 12.6, engagementScore: 86 },
      { name: 'Returning Visitors', visitors: 3_724, convRate: 6.2, engagementScore: 64 },
    ],
    creatives: [
      { name: 'Interactive Demo', type: 'HTML', impressions: 8_400, ctr: 16.2, status: 'Active' },
      { name: 'Feature Matrix', type: 'HTML', impressions: 14_800, ctr: 8.4, status: 'Active' },
      { name: 'Customer Story Video', type: 'Video', impressions: 6_200, ctr: 11.1, status: 'Paused' },
      { name: 'API Docs Link', type: 'Image', impressions: 0, ctr: 0, status: 'Draft' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TrendIndicator({ trend, invertTrend }: { trend: 'up' | 'down' | 'neutral'; invertTrend?: boolean }) {
  const isPositive = invertTrend ? trend === 'down' : trend === 'up';
  const isNegative = invertTrend ? trend === 'up' : trend === 'down';
  const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400';
  const Icon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  return <Icon className={`w-3 h-3 ${color}`} />;
}

const statusStyles: Record<string, string> = {
  Active: 'bg-green-50 text-green-700',
  Paused: 'bg-yellow-50 text-yellow-700',
  Draft: 'bg-gray-100 text-gray-500',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PageDeepDiveReport() {
  const [selectedPage, setSelectedPage] = useState('/homepage');
  const data = PAGES[selectedPage];

  return (
    <div className="space-y-6">
      {/* ---- Page Selector ---- */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="page-selector"
          className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide"
        >
          Page
        </label>
        <div className="relative">
          <select
            id="page-selector"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 py-1.5 text-[13px] font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          >
            {PAGE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} ({p.value})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* ---- KPI Cards ---- */}
      <div className="grid grid-cols-4 gap-4">
        {data.kpis.map((kpi) => {
          const isPositive = kpi.invertTrend
            ? kpi.trend === 'down'
            : kpi.trend === 'up';
          const isNegative = kpi.invertTrend
            ? kpi.trend === 'up'
            : kpi.trend === 'down';
          const trendColor = isPositive
            ? 'text-green-600'
            : isNegative
              ? 'text-red-500'
              : 'text-gray-400';

          return (
            <div key={kpi.label} className="rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                {kpi.label}
              </p>
              <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
                <TrendIndicator trend={kpi.trend} invertTrend={kpi.invertTrend} />
                <span className="text-[10px] font-semibold">{kpi.trendValue}</span>
                <span className="text-[10px] text-gray-400 ml-1">vs prev</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Content Spots ---- */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">
          Content Spots
        </p>
        <div className="grid grid-cols-2 gap-4">
          {data.spots.map((spot) => (
            <div key={spot.name} className="rounded-xl border border-gray-100 p-4">
              <p className="text-[11px] font-medium text-gray-900 mb-2">{spot.name}</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400">Impressions</p>
                  <p className="text-[11px] font-semibold text-gray-700">
                    {spot.impressions.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Clicks</p>
                  <p className="text-[11px] font-semibold text-gray-700">
                    {spot.clicks.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">CTR</p>
                  <p className="text-[11px] font-semibold text-gray-700">{spot.ctr.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Segments Table ---- */}
      <div className="rounded-2xl border border-gray-100 p-5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
          Segments
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">
                  Segment
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  Visitors
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  Conv Rate
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">
                  Engagement Score
                </th>
              </tr>
            </thead>
            <tbody>
              {data.segments.map((seg) => (
                <tr
                  key={seg.name}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-2.5 pr-3 text-[11px] font-medium text-gray-700">
                    {seg.name}
                  </td>
                  <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">
                    {seg.visitors.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">
                    {seg.convRate.toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-[11px] text-gray-700 text-right">
                    {seg.engagementScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Creatives Table ---- */}
      <div className="rounded-2xl border border-gray-100 p-5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-4">
          Creatives
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">
                  Creative
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">
                  Type
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  Impressions
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 text-right">
                  CTR
                </th>
                <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.creatives.map((cr) => (
                <tr
                  key={cr.name}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-2.5 pr-3 text-[11px] font-medium text-gray-700">
                    {cr.name}
                  </td>
                  <td className="py-2.5 pr-3 text-[11px] text-gray-700">{cr.type}</td>
                  <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">
                    {cr.impressions.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3 text-[11px] text-gray-700 text-right">
                    {cr.ctr > 0 ? `${cr.ctr.toFixed(1)}%` : '--'}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${statusStyles[cr.status]}`}
                    >
                      {cr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

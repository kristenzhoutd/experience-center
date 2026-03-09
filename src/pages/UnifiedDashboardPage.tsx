import { useState, useRef, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell } from 'recharts';

// --- Demo data ---

const budgetData = [
  { channel: 'Meta', current: 35000, recommended: 38000 },
  { channel: 'Google Search', current: 28000, recommended: 25000 },
  { channel: 'TikTok', current: 18000, recommended: 24000 },
  { channel: 'YouTube', current: 15000, recommended: 12000 },
  { channel: 'Google Shop', current: 8000, recommended: 11000 },
  { channel: 'LinkedIn', current: 5000, recommended: 5000 },
];

const budgetShifts = [
  { from: 'YouTube', to: 'TikTok', amount: 3000, reason: 'Higher engagement rate with target demographic' },
  { from: 'Google Search', to: 'Google Shop', amount: 2000, reason: 'Better ROAS on shopping campaigns' },
  { from: 'LinkedIn', to: 'Meta', amount: 1000, reason: 'Lower CPA on lookalike audiences' },
  { from: 'YouTube', to: 'TikTok', amount: 3000, reason: 'Video completion rates 2.3x higher' },
];

const sparkData = (seed: number) =>
  Array.from({ length: 12 }, (_, i) => ({
    v: Math.round(50 + Math.sin(i * 0.8 + seed) * 20 + Math.random() * 15),
  }));

const stats = [
  { label: 'Revenue', value: '$482,300', change: '+12.4%', up: true, spark: sparkData(1) },
  { label: 'Conversions', value: '18,740', change: '+8.2%', up: true, spark: sparkData(2) },
  { label: 'CPA', value: '$42', change: '-5.1%', up: true, spark: sparkData(3) },
  { label: 'ROAS', value: '3.8x', change: '+15.3%', up: true, spark: sparkData(4) },
];

const tabs = ['Cross Channel Orchestration', 'Campaigns', 'Audience', 'Creative'];

const channelColors: Record<string, string> = {
  Meta: '#3b82f6',
  'Google Search': '#ef4444',
  TikTok: '#ec4899',
  YouTube: '#f43f5e',
  'Google Shop': '#f97316',
  LinkedIn: '#0077b5',
};

const cpaByChannel = [
  { channel: 'TikTok', cpa: 28, color: '#ec4899' },
  { channel: 'Google Shop', cpa: 32, color: '#f97316' },
  { channel: 'Meta Ads', cpa: 38, color: '#3b82f6' },
  { channel: 'Google Search', cpa: 42, color: '#ef4444' },
  { channel: 'YouTube', cpa: 56, color: '#f43f5e' },
  { channel: 'LinkedIn', cpa: 72, color: '#0077b5' },
];

const topChannels = [
  { name: 'TikTok', roas: 5.2, ctr: 3.8, spend: '$18,000', revenue: '$93,600', trend: 'up' as const },
  { name: 'Meta Ads', roas: 4.1, ctr: 2.9, spend: '$35,000', revenue: '$143,500', trend: 'up' as const },
  { name: 'Google Shop', roas: 3.9, ctr: 4.2, spend: '$8,000', revenue: '$31,200', trend: 'up' as const },
];

const channelEfficiency = [
  { channel: 'TikTok', spend: '$18,000', revenue: '$93,600', roas: 5.2, cpa: 28, ctr: 3.8, convRate: 4.2, roasBar: 100 },
  { channel: 'Meta Ads', spend: '$35,000', revenue: '$143,500', roas: 4.1, cpa: 38, ctr: 2.9, convRate: 3.1, roasBar: 79 },
  { channel: 'Google Shop', spend: '$8,000', revenue: '$31,200', roas: 3.9, cpa: 32, ctr: 4.2, convRate: 5.1, roasBar: 75 },
  { channel: 'Google Search', spend: '$28,000', revenue: '$84,000', roas: 3.0, cpa: 42, ctr: 2.1, convRate: 2.8, roasBar: 58 },
  { channel: 'YouTube', spend: '$15,000', revenue: '$33,000', roas: 2.2, cpa: 56, ctr: 1.4, convRate: 1.9, roasBar: 42 },
  { channel: 'LinkedIn', spend: '$5,000', revenue: '$8,500', roas: 1.7, cpa: 72, ctr: 0.8, convRate: 1.2, roasBar: 33 },
];

const topCampaigns = [
  {
    rank: 1,
    name: 'Summer Sale - Lookalike Audiences',
    type: 'Retargeting',
    status: 'Scaling',
    statusColor: 'emerald',
    roas: 6.8,
    cpa: 18,
    revenue: '$48,200',
    trend: '+32%',
    trendUp: true,
    insights: [
      'Lookalike audience outperforming core by 2.1x',
      'Creative "Summer Vibes" driving 68% of conversions',
    ],
  },
  {
    rank: 2,
    name: 'Healthcare Awareness Q1',
    type: 'Prospecting',
    status: 'Stable',
    statusColor: 'blue',
    roas: 5.2,
    cpa: 24,
    revenue: '$36,800',
    trend: '+18%',
    trendUp: true,
    insights: [
      'Video ads showing 3.2x higher engagement',
      'Age 35-54 segment converting at highest rate',
    ],
  },
  {
    rank: 3,
    name: 'Brand Refresh - Multi-Channel',
    type: 'Awareness',
    status: 'Scaling',
    statusColor: 'emerald',
    roas: 4.5,
    cpa: 29,
    revenue: '$31,500',
    trend: '+12%',
    trendUp: true,
    insights: [
      'TikTok channel driving 45% of new reach',
      'Carousel format outperforming single image by 1.8x',
    ],
  },
];

const bottomCampaigns = [
  {
    rank: 1,
    name: 'LinkedIn B2B Lead Gen',
    type: 'Lead Gen',
    status: 'Declining',
    statusColor: 'red',
    roas: 1.2,
    cpa: 89,
    revenue: '$4,200',
    trend: '-24%',
    trendUp: false,
    recommendation: 'Pause underperforming ad sets and refresh creative. CPA has risen 42% over 14 days.',
  },
  {
    rank: 2,
    name: 'YouTube Pre-Roll - Product Demo',
    type: 'Video',
    status: 'Testing',
    statusColor: 'amber',
    roas: 1.8,
    cpa: 67,
    revenue: '$7,800',
    trend: '-15%',
    trendUp: false,
    recommendation: 'Shorten video creatives to 15s. Current 30s completion rate at 18% vs benchmark 35%.',
  },
  {
    rank: 3,
    name: 'Google Display - Remarketing',
    type: 'Remarketing',
    status: 'Declining',
    statusColor: 'red',
    roas: 1.5,
    cpa: 72,
    revenue: '$5,400',
    trend: '-19%',
    trendUp: false,
    recommendation: 'Audience fatigue detected. Expand remarketing window from 7 to 30 days and exclude converters.',
  },
];

// --- Campaigns Tab: Chart Data ---

const campaignPerformanceTrend = [
  { day: 'Feb 7', roas: 3.2, cpa: 44, conversions: 820, spend: 36080 },
  { day: 'Feb 8', roas: 3.4, cpa: 41, conversions: 880, spend: 36080 },
  { day: 'Feb 9', roas: 3.1, cpa: 46, conversions: 760, spend: 34960 },
  { day: 'Feb 10', roas: 3.6, cpa: 38, conversions: 950, spend: 36100 },
  { day: 'Feb 11', roas: 3.5, cpa: 39, conversions: 910, spend: 35490 },
  { day: 'Feb 12', roas: 3.8, cpa: 36, conversions: 1020, spend: 36720 },
  { day: 'Feb 13', roas: 3.3, cpa: 42, conversions: 840, spend: 35280 },
  { day: 'Feb 14', roas: 3.9, cpa: 35, conversions: 1080, spend: 37800 },
  { day: 'Feb 15', roas: 4.1, cpa: 33, conversions: 1150, spend: 37950 },
  { day: 'Feb 16', roas: 3.7, cpa: 37, conversions: 980, spend: 36260 },
  { day: 'Feb 17', roas: 4.0, cpa: 34, conversions: 1120, spend: 38080 },
  { day: 'Feb 18', roas: 3.8, cpa: 36, conversions: 1040, spend: 37440 },
  { day: 'Feb 19', roas: 4.2, cpa: 32, conversions: 1180, spend: 37760 },
  { day: 'Feb 20', roas: 3.9, cpa: 35, conversions: 1100, spend: 38500 },
];

const campaignTypeBreakdown = [
  { name: 'Awareness', value: 5, color: '#3b82f6' },
  { name: 'Conversion', value: 8, color: '#10b981' },
  { name: 'Retargeting', value: 4, color: '#f59e0b' },
  { name: 'Engagement', value: 3, color: '#8b5cf6' },
];

const campaignStatusBreakdown = [
  { name: 'Active', value: 12, color: '#10b981' },
  { name: 'Paused', value: 4, color: '#f59e0b' },
  { name: 'Draft', value: 2, color: '#9ca3af' },
  { name: 'Scheduled', value: 2, color: '#3b82f6' },
];

const audienceSegments = [
  {
    name: 'Female, 25-34, Urban',
    roas: 5.8,
    roasLevel: 'high' as const,
    spend: '$12,400',
    revenue: '$71,920',
    conversions: '2,840',
    trend: '+28%',
    trendUp: true,
    topChannel: 'TikTok',
    campaigns: 4,
    insight: 'Highest converting demographic. Video creative resonates strongly with this segment, particularly UGC-style content on TikTok.',
  },
  {
    name: 'Male, 35-44, Suburban',
    roas: 4.2,
    roasLevel: 'high' as const,
    spend: '$18,600',
    revenue: '$78,120',
    conversions: '3,150',
    trend: '+15%',
    trendUp: true,
    topChannel: 'Google Search',
    campaigns: 6,
    insight: 'Strong intent-driven conversions via search. Respond well to comparison and review-style ad copy.',
  },
  {
    name: 'Female, 45-54, Rural',
    roas: 3.6,
    roasLevel: 'medium' as const,
    spend: '$8,200',
    revenue: '$29,520',
    conversions: '1,420',
    trend: '+8%',
    trendUp: true,
    topChannel: 'Meta Ads',
    campaigns: 3,
    insight: 'Steady growth segment. Facebook carousel ads perform best. Consider expanding to Instagram Reels for incremental reach.',
  },
  {
    name: 'Male, 18-24, Urban',
    roas: 3.1,
    roasLevel: 'medium' as const,
    spend: '$14,800',
    revenue: '$45,880',
    conversions: '2,680',
    trend: '+22%',
    trendUp: true,
    topChannel: 'TikTok',
    campaigns: 5,
    insight: 'High volume but lower AOV. Short-form video drives engagement. Trending audio integration lifts CTR by 1.4x.',
  },
  {
    name: 'Female, 55+, Suburban',
    roas: 2.4,
    roasLevel: 'medium' as const,
    spend: '$6,400',
    revenue: '$15,360',
    conversions: '890',
    trend: '+3%',
    trendUp: true,
    topChannel: 'Google Shop',
    campaigns: 2,
    insight: 'Price-sensitive segment. Shopping ads with promotional pricing outperform standard display by 2.8x.',
  },
  {
    name: 'Male, 25-34, Suburban',
    roas: 4.5,
    roasLevel: 'high' as const,
    spend: '$11,200',
    revenue: '$50,400',
    conversions: '2,100',
    trend: '+19%',
    trendUp: true,
    topChannel: 'YouTube',
    campaigns: 4,
    insight: 'Strong mid-funnel engagement. Product demo videos on YouTube drive high-quality leads that convert at 2x the average rate.',
  },
  {
    name: 'Female, 35-44, Urban',
    roas: 1.8,
    roasLevel: 'low' as const,
    spend: '$9,800',
    revenue: '$17,640',
    conversions: '720',
    trend: '-12%',
    trendUp: false,
    topChannel: 'LinkedIn',
    campaigns: 3,
    insight: 'Declining performance. Creative fatigue detected across LinkedIn campaigns. Recommend pausing lowest performers and testing new messaging.',
  },
  {
    name: 'Male, 45-54, Rural',
    roas: 1.4,
    roasLevel: 'low' as const,
    spend: '$5,600',
    revenue: '$7,840',
    conversions: '380',
    trend: '-18%',
    trendUp: false,
    topChannel: 'Google Display',
    campaigns: 2,
    insight: 'Low engagement and high CPA. Audience overlap with better-performing segments. Consider consolidating into broader targeting groups.',
  },
];

// --- Audience Tab: Chart Data ---

const audienceSpendRevenueData = audienceSegments.map((seg) => ({
  name: seg.name.split(',').slice(0, 2).join(','),
  spend: parseFloat(seg.spend.replace(/[$,]/g, '')),
  revenue: parseFloat(seg.revenue.replace(/[$,]/g, '')),
  roas: seg.roas,
}));

const creativeBubbles = [
  { name: 'Summer Vibes Video', impressions: 820000, roas: 6.2, spend: 12000, channel: 'TikTok' },
  { name: 'Product Demo 30s', impressions: 540000, roas: 4.8, spend: 9500, channel: 'YouTube' },
  { name: 'UGC Testimonial', impressions: 680000, roas: 5.5, spend: 8200, channel: 'Meta' },
  { name: 'Carousel Lifestyle', impressions: 420000, roas: 4.1, spend: 7800, channel: 'Meta' },
  { name: 'Search Ad Copy A', impressions: 310000, roas: 3.8, spend: 6400, channel: 'Google' },
  { name: 'Banner 728x90', impressions: 950000, roas: 1.4, spend: 11000, channel: 'Google' },
  { name: 'Pre-Roll 15s', impressions: 620000, roas: 2.1, spend: 8800, channel: 'YouTube' },
  { name: 'Static Promo', impressions: 280000, roas: 1.8, spend: 5200, channel: 'LinkedIn' },
  { name: 'Reels Trend Hook', impressions: 760000, roas: 5.9, spend: 6800, channel: 'TikTok' },
  { name: 'Sponsored Post', impressions: 180000, roas: 1.2, spend: 4500, channel: 'LinkedIn' },
];

const scaleWinners = [
  {
    name: 'Summer Vibes Video',
    channel: 'TikTok',
    format: 'Video 15s',
    roas: 6.2,
    ctr: 4.8,
    spend: '$12,000',
    conversions: '1,840',
    insight: 'UGC-style creative with trending audio. Engagement rate 3.2x above benchmark. Scale budget by 40% to capture remaining addressable audience.',
  },
  {
    name: 'UGC Testimonial',
    channel: 'Meta Ads',
    format: 'Video 30s',
    roas: 5.5,
    ctr: 3.6,
    spend: '$8,200',
    conversions: '1,420',
    insight: 'Authentic testimonial format driving high trust signals. Perform well across 25-44 age segments. Test variations with different testimonial subjects.',
  },
  {
    name: 'Reels Trend Hook',
    channel: 'TikTok',
    format: 'Reel 9:16',
    roas: 5.9,
    ctr: 5.1,
    spend: '$6,800',
    conversions: '1,180',
    insight: 'Hook-first creative pattern with 92% 3-second retention. Trending format drives organic amplification. Duplicate pattern across new product lines.',
  },
];

const pauseRefresh = [
  {
    name: 'Banner 728x90',
    channel: 'Google Display',
    format: 'Static Banner',
    roas: 1.4,
    ctr: 0.3,
    spend: '$11,000',
    conversions: '210',
    recommendation: 'Creative fatigue — CTR dropped 45% over 21 days. Pause immediately and replace with animated HTML5 variant.',
  },
  {
    name: 'Static Promo',
    channel: 'LinkedIn',
    format: 'Single Image',
    roas: 1.8,
    ctr: 0.6,
    spend: '$5,200',
    conversions: '180',
    recommendation: 'Low engagement on professional audience. Test carousel format with case study data points instead of promotional messaging.',
  },
  {
    name: 'Sponsored Post',
    channel: 'LinkedIn',
    format: 'Sponsored Content',
    roas: 1.2,
    ctr: 0.4,
    spend: '$4,500',
    conversions: '95',
    recommendation: 'Lowest performing creative. Audience overlap with Static Promo at 68%. Consolidate budget into better-performing LinkedIn formats.',
  },
];

// --- Creative Tab: Chart Data ---

const creativeFormatPerformance = [
  { format: 'Video', count: 5, avgRoas: 5.3, avgCtr: 3.8, spend: 39300, conversions: 4440 },
  { format: 'Image', count: 3, avgRoas: 1.5, avgCtr: 0.5, spend: 21400, conversions: 485 },
  { format: 'Carousel', count: 2, avgRoas: 4.1, avgCtr: 4.2, spend: 7800, conversions: 1420 },
];

const creativeFatigueTimeline = [
  { name: 'Summer Vibes Video', daysActive: 14, fatigue: 18, status: 'fresh' as const },
  { name: 'UGC Testimonial', daysActive: 21, fatigue: 32, status: 'fresh' as const },
  { name: 'Reels Trend Hook', daysActive: 10, fatigue: 12, status: 'fresh' as const },
  { name: 'Carousel Lifestyle', daysActive: 28, fatigue: 45, status: 'fresh' as const },
  { name: 'Product Demo 30s', daysActive: 35, fatigue: 58, status: 'warning' as const },
  { name: 'Pre-Roll 15s', daysActive: 42, fatigue: 65, status: 'warning' as const },
  { name: 'Banner 728x90', daysActive: 48, fatigue: 82, status: 'danger' as const },
  { name: 'Static Promo', daysActive: 38, fatigue: 71, status: 'danger' as const },
  { name: 'Search Ad Copy A', daysActive: 30, fatigue: 40, status: 'fresh' as const },
  { name: 'Sponsored Post', daysActive: 45, fatigue: 78, status: 'danger' as const },
];

// --- Campaigns Tab: Campaign Table ---

const campaignRows = [
  { name: 'Q1 Brand Awareness', channel: 'Meta', status: 'Active' as const, spend: 14200, budget: 25000, conversions: 412, roas: 3.2, ctr: 2.75, trend: 'up' as const },
  { name: 'LinkedIn Lead Gen', channel: 'LinkedIn', status: 'Active' as const, spend: 4200, budget: 8000, conversions: 128, roas: 2.5, ctr: 1.85, trend: 'down' as const },
  { name: 'TikTok Engagement', channel: 'TikTok', status: 'Active' as const, spend: 3200, budget: 7000, conversions: 117, roas: 3.6, ctr: 3.42, trend: 'up' as const },
  { name: 'Google Search - Brand', channel: 'Google', status: 'Active' as const, spend: 3400, budget: 6000, conversions: 105, roas: 2.8, ctr: 2.41, trend: 'up' as const },
  { name: 'Google Display Retarget', channel: 'Google', status: 'Paused' as const, spend: 2400, budget: 4000, conversions: 90, roas: 2.9, ctr: 1.92, trend: 'down' as const },
];

// --- Creative Tab: Top Creatives ---

const topCreatives = [
  { name: 'Hero Video - Brand Story', type: 'Video', channel: 'Meta', impressions: '220K', ctr: '3.09%', conversions: 125, roas: 3.8 },
  { name: 'Carousel - Product Features', type: 'Carousel', channel: 'Meta', impressions: '180K', ctr: '2.85%', conversions: 98, roas: 3.4 },
  { name: 'Static - Limited Offer', type: 'Image', channel: 'TikTok', impressions: '95K', ctr: '3.42%', conversions: 72, roas: 3.6 },
  { name: 'Search Ad - Brand Terms', type: 'Text', channel: 'Google', impressions: '340K', ctr: '2.41%', conversions: 105, roas: 2.8 },
];

const aiRecommendations = [
  {
    title: 'Audience Expansion',
    description: 'Expand TikTok lookalike audiences to 3% from 1%. Data suggests broader targeting yields 18% lower CPA with minimal drop in conversion quality.',
    impact: 'Est. +$12,400 revenue',
    icon: '👥',
  },
  {
    title: 'Creative Refresh',
    description: 'YouTube ad creatives show fatigue signals. Click-through rate dropped 23% over 14 days. Recommend refreshing top 3 creatives.',
    impact: 'Est. +8% CTR recovery',
    icon: '🎨',
  },
  {
    title: 'Dayparting Strategy',
    description: 'Meta campaigns perform 34% better between 6-9 PM. Shift 40% of budget to evening hours for improved ROAS.',
    impact: 'Est. +0.6 ROAS lift',
    icon: '⏰',
  },
];

// --- Tiny sparkline ---

function Sparkline({ data, positive }: { data: { v: number }[]; positive: boolean }) {
  const color = positive ? '#10b981' : '#ef4444';
  const gradientId = positive ? 'spark-green' : 'spark-red';
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Component ---

const suggestedPrompts = [
  'Optimize budget allocation across channels',
  'Analyze underperforming campaigns',
  'Suggest audience expansion opportunities',
  'Compare creative performance trends',
];

export default function UnifiedDashboardPage() {
  const [showBanner, setShowBanner] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hi Alexandra! I\'m your AI performance agent. Ask me anything about your campaigns, budgets, or audiences — I can analyze data and suggest optimizations.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [campaignTrendMetric, setCampaignTrendMetric] = useState<'spend' | 'conversions' | 'roas'>('spend');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: chatInput },
      { role: 'assistant', text: 'I\'m analyzing your data... This is a demo response. In production, this would connect to the AI agent for real-time insights.' },
    ]);
    setChatInput('');
  };

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const totalCurrent = budgetData.reduce((s, d) => s + d.current, 0);
  const totalRecommended = budgetData.reduce((s, d) => s + d.recommended, 0);
  const delta = ((totalRecommended - totalCurrent) / totalCurrent) * 100;

  return (
    <div className="h-full flex bg-[#F7F8FB]">
      {/* Chat toggle button (visible when chat is closed) */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute left-16 bottom-6 z-40 w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105"
          title="Open AI Agent"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </button>
      )}

      {/* Agent Chat Panel */}
      <div
        className={`flex-shrink-0 border-r border-gray-200 bg-white flex flex-col transition-all duration-300 overflow-hidden ${
          chatOpen ? 'w-[360px]' : 'w-0'
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI Agent</h3>
              <p className="text-[10px] text-gray-400">Performance Optimizer</p>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />

          {/* Suggested prompts (only show when few messages) */}
          {chatMessages.length <= 1 && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Suggested</p>
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setChatInput(prompt);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-100 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask the AI agent..."
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-8 py-6 space-y-6">

        {/* Welcome Banner */}
        {showBanner && (
          <div className="relative rounded-2xl overflow-hidden px-6 py-5"
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #3b82f6 100%)',
            }}
          >
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-white/80 text-sm font-medium">Welcome back, Performance Marketer!</p>
            <p className="text-white text-lg font-semibold mt-1">Your dashboard is optimized for Healthcare.</p>
          </div>
        )}

        {/* Daily Briefing */}
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Daily Briefing</span>
              <span className="text-xs text-gray-400">{dayName}, {dateStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Updated {timeStr}</span>
              <button
                onClick={() => window.location.reload()}
                className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh data"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-teal-600 mb-1">{greeting}, Alexandra!</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
            Performance on track. Spend pacing aligned, CPA below target. Two campaigns need attention due to rising costs.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${s.up ? 'text-emerald-500' : 'text-red-500'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={s.up ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                  </svg>
                  {s.change}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-gray-900">{s.value}</span>
                <Sparkline data={s.spark} positive={s.up} />
              </div>
            </div>
          ))}
          {/* Spend / Pacing card */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Spend / Pacing</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">On Track</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">$6,800</span>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span>$6,800 / $10,000</span>
                <span>68%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === i
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content - Cross Channel Orchestration */}
        {activeTab === 0 && (<>
          <div className="grid grid-cols-2 gap-6">
            {/* Budget Allocation Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Current vs. Recommended Budget Allocation</h3>
              <p className="text-xs text-gray-400 mb-5">AI-optimized budget distribution across channels</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData} barGap={4} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, '']}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="current" name="Current Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recommended" name="Recommended" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Spend</p>
                  <p className="text-sm font-semibold text-gray-900">${(totalCurrent / 1000).toFixed(0)}k</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Efficient ROAS</p>
                  <p className="text-sm font-semibold text-emerald-600">${(totalRecommended / 1000).toFixed(0)}k</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Delta</p>
                  <p className="text-sm font-semibold text-emerald-600">+{delta.toFixed(0)}%</p>
                </div>
              </div>
            </div>

            {/* Recommended Budget Shifts */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Recommended Budget Shifts</h3>
              <p className="text-xs text-gray-400 mb-5">AI-suggested reallocations to improve performance</p>
              <div className="space-y-3">
                {budgetShifts.map((shift, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{shift.from}</span>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="text-xs font-medium text-gray-900 whitespace-nowrap">{shift.to}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">+${shift.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Channel Performance Metrics + Top Performing Channels */}
          <div className="grid grid-cols-2 gap-6">
            {/* CPA by Channel - Horizontal Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Channel Performance Metrics</h3>
              <p className="text-xs text-gray-400 mb-5">Cost per acquisition by channel</p>
              <div className="space-y-3">
                {cpaByChannel.map((ch) => (
                  <div key={ch.channel} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 text-right flex-shrink-0">{ch.channel}</span>
                    <div className="flex-1 h-6 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(ch.cpa / 80) * 100}%`, backgroundColor: ch.color }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 w-10 flex-shrink-0">${ch.cpa}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Channels */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Performing Channels</h3>
              <p className="text-xs text-gray-400 mb-5">Highest ROAS across active campaigns</p>
              <div className="space-y-3">
                {topChannels.map((ch, i) => (
                  <div key={ch.name} className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        <span className="text-sm font-semibold text-gray-900">{ch.name}</span>
                      </div>
                      <span className="text-xs text-emerald-500 font-medium flex items-center gap-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                        Trending
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-400">ROAS</p>
                        <p className="text-sm font-bold text-gray-900">{ch.roas}x</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">CTR</p>
                        <p className="text-sm font-bold text-gray-900">{ch.ctr}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Spend</p>
                        <p className="text-sm font-bold text-gray-900">{ch.spend}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Revenue</p>
                        <p className="text-sm font-bold text-gray-900">{ch.revenue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Channel Efficiency Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Channel Efficiency</h3>
            <p className="text-xs text-gray-400 mb-5">Comprehensive performance breakdown across all channels</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Channel</th>
                    <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-3 px-3">Spend</th>
                    <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-3 px-3">Revenue</th>
                    <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-3 px-3 w-32">ROAS</th>
                    <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-3 px-3">CPA</th>
                    <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-3 px-3">CTR</th>
                    <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-3 pl-3">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {channelEfficiency.map((row) => (
                    <tr key={row.channel} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-900 text-xs">{row.channel}</td>
                      <td className="py-3 px-3 text-right text-xs text-gray-600">{row.spend}</td>
                      <td className="py-3 px-3 text-right text-xs text-gray-600">{row.revenue}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${row.roasBar}%`,
                                backgroundColor: row.roas >= 4 ? '#10b981' : row.roas >= 3 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 w-8">{row.roas}x</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-gray-600">${row.cpa}</td>
                      <td className="py-3 px-3 text-right text-xs text-gray-600">{row.ctr}%</td>
                      <td className="py-3 pl-3 text-right text-xs text-gray-600">{row.convRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Strategy Recommendations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Strategy Recommendations</h3>
            <p className="text-xs text-gray-400 mb-4">Data-driven suggestions to optimize campaign performance</p>
            <div className="grid grid-cols-3 gap-4">
              {aiRecommendations.map((rec) => (
                <div key={rec.title} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{rec.icon}</span>
                    <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{rec.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{rec.impact}</span>
                    <button className="text-xs font-medium text-blue-500 hover:text-blue-600">Apply</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* Campaigns tab */}
        {activeTab === 1 && (<>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Campaign Performance</h3>
            <p className="text-xs text-gray-400 mb-5">Real-time performance tracking across all active campaigns</p>
          </div>

          {/* Campaign Performance Trend - Switchable Metric */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Campaign Performance Trend</h4>
                <p className="text-xs text-gray-400">Past 14 days</p>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['spend', 'conversions', 'roas'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setCampaignTrendMetric(m)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer border-none ${
                      campaignTrendMetric === m ? 'bg-white text-gray-900 shadow-sm' : 'bg-transparent text-gray-500'
                    }`}
                  >
                    {m === 'spend' ? 'Spend' : m === 'conversions' ? 'Conv.' : 'ROAS'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={campaignPerformanceTrend} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="campaignTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={
                        campaignTrendMetric === 'spend' ? '#3b82f6' : campaignTrendMetric === 'conversions' ? '#10b981' : '#8b5cf6'
                      } stopOpacity={0.15} />
                      <stop offset="95%" stopColor={
                        campaignTrendMetric === 'spend' ? '#3b82f6' : campaignTrendMetric === 'conversions' ? '#10b981' : '#8b5cf6'
                      } stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    tickFormatter={v =>
                      campaignTrendMetric === 'spend' ? `$${(v / 1000).toFixed(0)}k`
                      : campaignTrendMetric === 'roas' ? `${v}x`
                      : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 11, padding: '8px 12px' }}
                    formatter={(value: number | undefined) => [
                      campaignTrendMetric === 'spend' ? `$${(value ?? 0).toLocaleString()}`
                      : campaignTrendMetric === 'roas' ? `${value}x`
                      : String(value ?? 0),
                      campaignTrendMetric === 'spend' ? 'Spend' : campaignTrendMetric === 'conversions' ? 'Conversions' : 'ROAS'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey={campaignTrendMetric}
                    stroke={campaignTrendMetric === 'spend' ? '#3b82f6' : campaignTrendMetric === 'conversions' ? '#10b981' : '#8b5cf6'}
                    strokeWidth={2}
                    fill="url(#campaignTrendGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaign Type & Status Distribution */}
          <div className="grid grid-cols-2 gap-6">
            {/* Campaign Type Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Campaigns by Type</h4>
              <p className="text-xs text-gray-400 mb-4">Distribution across campaign objectives</p>
              <div className="flex items-center gap-6">
                <div className="h-[160px] w-[160px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={campaignTypeBreakdown}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {campaignTypeBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 11 }}
                        formatter={(value: number | undefined) => [`${value ?? 0} campaigns`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {campaignTypeBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Total</span>
                      <span className="text-xs font-bold text-gray-900">
                        {campaignTypeBreakdown.reduce((s, d) => s + d.value, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Status Distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Campaigns by Status</h4>
              <p className="text-xs text-gray-400 mb-4">Current operational state</p>
              <div className="flex items-center gap-6">
                <div className="h-[160px] w-[160px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={campaignStatusBreakdown}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {campaignStatusBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 11 }}
                        formatter={(value: number | undefined) => [`${value ?? 0} campaigns`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {campaignStatusBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Total</span>
                      <span className="text-xs font-bold text-gray-900">
                        {campaignStatusBreakdown.reduce((s, d) => s + d.value, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Performance Table */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Campaign Performance</h4>
              <p className="text-xs text-gray-400">{campaignRows.length} campaigns — sorted by spend</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4">Campaign</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4">Channel</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4">Status</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4 text-right">Spend</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4 text-right">Budget</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4 text-right">Conv.</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4 text-right">ROAS</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 pr-4 text-right">CTR</th>
                    <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2.5 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignRows.map(c => {
                    const pacing = Math.round((c.spend / c.budget) * 100);
                    return (
                      <tr key={c.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 pr-4">
                          <span className="text-xs font-medium text-gray-900">{c.name}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-[10px] text-gray-500">{c.channel}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            c.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-xs font-medium text-gray-900">${(c.spend / 1000).toFixed(1)}K</span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pacing > 85 ? 'bg-red-400' : pacing > 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${pacing}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400">{pacing}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-xs text-gray-900">{c.conversions}</span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className={`text-xs font-semibold ${c.roas >= 3 ? 'text-emerald-600' : c.roas >= 2 ? 'text-gray-900' : 'text-red-500'}`}>{c.roas}x</span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="text-xs text-gray-600">{c.ctr}%</span>
                        </td>
                        <td className="py-3 text-right">
                          <svg className={`w-3.5 h-3.5 inline ${c.trend === 'up' ? 'text-emerald-500' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={c.trend === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                          </svg>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Performing Campaigns */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Top Performing Campaigns</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {topCampaigns.map((c) => (
                <div key={c.name} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">#{c.rank}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>{c.status}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.type}</span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{c.name}</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    <div>
                      <p className="text-[10px] text-gray-400">ROAS</p>
                      <p className="text-sm font-bold text-gray-900">{c.roas}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">CPA</p>
                      <p className="text-sm font-bold text-gray-900">${c.cpa}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Revenue</p>
                      <p className="text-sm font-bold text-gray-900">{c.revenue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Trend</p>
                      <p className="text-sm font-bold text-emerald-500 flex items-center gap-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                        {c.trend}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3 space-y-1.5">
                    {c.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <p className="text-[11px] text-gray-500 leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Performing Campaigns */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Bottom Performing</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {bottomCampaigns.map((c) => (
                <div key={c.name} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">#{c.rank}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.statusColor === 'red' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                      }`}>{c.status}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.type}</span>
                  </div>
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{c.name}</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    <div>
                      <p className="text-[10px] text-gray-400">ROAS</p>
                      <p className="text-sm font-bold text-gray-900">{c.roas}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">CPA</p>
                      <p className="text-sm font-bold text-gray-900">${c.cpa}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Revenue</p>
                      <p className="text-sm font-bold text-gray-900">{c.revenue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Trend</p>
                      <p className="text-sm font-bold text-red-500 flex items-center gap-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                        {c.trend}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-start gap-1.5">
                      <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{c.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* Audience tab */}
        {activeTab === 2 && (<>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Audience Performance Analysis</h3>
            <p className="text-xs text-gray-400 mb-5">Segment-level performance insights across all active campaigns</p>
          </div>

          {/* Audience ROAS Comparison + Spend vs Revenue */}
          <div className="grid grid-cols-2 gap-6">
            {/* Audience ROAS Comparison */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Audience ROAS Comparison</h4>
              <p className="text-xs text-gray-400 mb-5">Return on ad spend by segment</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={audienceSpendRevenueData} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}x`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      formatter={(value: number | undefined) => [`${value ?? 0}x`, 'ROAS']}
                    />
                    <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                      {audienceSpendRevenueData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.roas >= 4 ? '#10b981' : entry.roas >= 2.5 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Spend vs Revenue */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Spend vs Revenue by Audience</h4>
              <p className="text-xs text-gray-400 mb-5">Investment efficiency across segments</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={audienceSpendRevenueData} barGap={4} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                      formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="spend" name="Spend" fill="#ef4444" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {audienceSegments.map((seg) => (
              <div key={seg.name} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-900 leading-snug">{seg.name}</h5>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    seg.roasLevel === 'high' ? 'bg-emerald-50 text-emerald-600' :
                    seg.roasLevel === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-500'
                  }`}>{seg.roas}x ROAS</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                  <div>
                    <p className="text-[10px] text-gray-400">Spend</p>
                    <p className="text-sm font-bold text-gray-900">{seg.spend}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Revenue</p>
                    <p className="text-sm font-bold text-gray-900">{seg.revenue}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Conversions</p>
                    <p className="text-sm font-bold text-gray-900">{seg.conversions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Trend</p>
                    <p className={`text-sm font-bold flex items-center gap-0.5 ${seg.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={seg.trendUp ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                      </svg>
                      {seg.trend}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] text-gray-400 mb-1">
                    Top Channel: <span className="font-semibold text-gray-700">{seg.topChannel}</span> <span className="text-gray-300">({seg.campaigns} campaigns)</span>
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{seg.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* Creative tab */}
        {activeTab === 3 && (<>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Creative Performance Analysis</h3>
            <p className="text-xs text-gray-400 mb-5">Visual performance mapping across all active creatives</p>
          </div>

          {/* Creative Format Performance + Fatigue Tracker */}
          <div className="grid grid-cols-2 gap-6">
            {/* Format Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Performance by Format</h4>
              <p className="text-xs text-gray-400 mb-5">Average ROAS and CTR by creative type</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creativeFormatPerformance} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="format" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}x`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar yAxisId="left" dataKey="avgRoas" name="Avg ROAS" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="avgCtr" name="Avg CTR %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                {creativeFormatPerformance.map((f) => (
                  <div key={f.format} className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{f.format}</p>
                    <p className="text-sm font-bold text-gray-900">{f.count} creatives</p>
                    <p className="text-[10px] text-gray-400">${(f.spend / 1000).toFixed(1)}k spend</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Creative Fatigue Tracker */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Creative Fatigue Tracker</h4>
              <p className="text-xs text-gray-400 mb-5">Lifecycle health across all active creatives</p>
              <div className="space-y-2.5">
                {[...creativeFatigueTimeline]
                  .sort((a, b) => b.fatigue - a.fatigue)
                  .map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-600 w-[120px] truncate flex-shrink-0" title={c.name}>
                      {c.name}
                    </span>
                    <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${c.fatigue}%`,
                          backgroundColor: c.status === 'danger' ? '#ef4444'
                            : c.status === 'warning' ? '#f59e0b'
                            : '#10b981',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-semibold ${
                        c.status === 'danger' ? 'text-red-500'
                          : c.status === 'warning' ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}>
                        {c.fatigue}%
                      </span>
                      <span className="text-[10px] text-gray-400">{c.daysActive}d</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-gray-400">Fresh (&lt;50%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] text-gray-400">Warning (50-69%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-gray-400">Fatigued (70%+)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Creatives */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Top Performing Creatives</h4>
            <p className="text-[10px] text-gray-400 mb-4">Ranked by ROAS</p>
            <div className="grid grid-cols-4 gap-3">
              {topCreatives.map((cr, i) => (
                <div key={cr.name} className="bg-gray-50 rounded-xl px-4 py-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                      {i + 1}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">{cr.type} · {cr.channel}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 mb-2 truncate" title={cr.name}>{cr.name}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[9px] text-gray-400">Impr.</div>
                      <div className="text-[10px] font-semibold text-gray-900">{cr.impressions}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400">CTR</div>
                      <div className="text-[10px] font-semibold text-gray-900">{cr.ctr}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400">ROAS</div>
                      <div className="text-[10px] font-semibold text-emerald-600">{cr.roas}x</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bubble Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Creative Performance: Volume vs. ROAS</h4>
            <p className="text-xs text-gray-400 mb-5">Bubble size represents spend allocation</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="impressions"
                    type="number"
                    name="Impressions"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    label={{ value: 'Impressions (Volume)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#9ca3af' }}
                  />
                  <YAxis
                    dataKey="roas"
                    type="number"
                    name="ROAS"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}x`}
                    label={{ value: 'ROAS', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#9ca3af' }}
                  />
                  <ZAxis dataKey="spend" range={[200, 1200]} name="Spend" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 text-xs">
                          <p className="font-semibold text-gray-900 mb-1">{d.name}</p>
                          <p className="text-gray-500">Channel: <span className="text-gray-700">{d.channel}</span></p>
                          <p className="text-gray-500">Impressions: <span className="text-gray-700">{(d.impressions / 1000).toFixed(0)}k</span></p>
                          <p className="text-gray-500">ROAS: <span className="text-gray-700">{d.roas}x</span></p>
                          <p className="text-gray-500">Spend: <span className="text-gray-700">${d.spend.toLocaleString()}</span></p>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={creativeBubbles.filter(d => d.roas >= 3.5)}
                    fill="#10b981"
                    fillOpacity={0.7}
                    name="High ROAS"
                  />
                  <Scatter
                    data={creativeBubbles.filter(d => d.roas >= 2 && d.roas < 3.5)}
                    fill="#f59e0b"
                    fillOpacity={0.7}
                    name="Medium ROAS"
                  />
                  <Scatter
                    data={creativeBubbles.filter(d => d.roas < 2)}
                    fill="#ef4444"
                    fillOpacity={0.7}
                    name="Low ROAS"
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scale Winners + Pause/Refresh */}
          <div className="grid grid-cols-2 gap-6">
            {/* Scale Winners */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </span>
                <h4 className="text-sm font-semibold text-gray-900">Scale Winners</h4>
              </div>
              <div className="space-y-4">
                {scaleWinners.map((c) => (
                  <div key={c.name} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-gray-900">{c.name}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{c.roas}x ROAS</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.channel}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.format}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] text-gray-400">ROAS</p>
                        <p className="text-sm font-bold text-gray-900">{c.roas}x</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">CTR</p>
                        <p className="text-sm font-bold text-gray-900">{c.ctr}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Spend</p>
                        <p className="text-sm font-bold text-gray-900">{c.spend}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Conversions</p>
                        <p className="text-sm font-bold text-gray-900">{c.conversions}</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <p className="text-[11px] text-gray-500 leading-relaxed">{c.insight}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pause / Refresh */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
                <h4 className="text-sm font-semibold text-gray-900">Pause / Refresh</h4>
              </div>
              <div className="space-y-4">
                {pauseRefresh.map((c) => (
                  <div key={c.name} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-gray-900">{c.name}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">{c.roas}x ROAS</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.channel}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{c.format}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] text-gray-400">ROAS</p>
                        <p className="text-sm font-bold text-gray-900">{c.roas}x</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">CTR</p>
                        <p className="text-sm font-bold text-gray-900">{c.ctr}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Spend</p>
                        <p className="text-sm font-bold text-gray-900">{c.spend}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Conversions</p>
                        <p className="text-sm font-bold text-gray-900">{c.conversions}</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-start gap-1.5">
                        <svg className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-[11px] text-gray-500 leading-relaxed">{c.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}
      </div>
      </div>
    </div>
  );
}

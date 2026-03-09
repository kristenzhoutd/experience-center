import { useState, useMemo } from 'react';
import { ABTestRecommendation, TestType, TestPriority, TestVariant } from '../../types/ai-features';

interface CampaignData {
  id: string;
  name: string;
  status: string;
  healthScore: number;
}

interface ABTestRecommendationsProps {
  campaigns: CampaignData[];
  onClose?: () => void;
  onStartTest?: (test: ABTestRecommendation) => void;
  onAskAI?: (question: string) => void;
}

// Icon components
const ImageIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>);
const UsersIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const DollarIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const LayoutIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>);
const TextIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>);
const LinkIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>);
const ClockIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const FlaskIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>);
const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const SparkleIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>);
const PlayIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>);

const testTypeConfig: Record<TestType, { label: string; icon: React.ReactNode; color: string }> = {
  creative: { label: 'Creative', icon: <ImageIcon />, color: '#8B5CF6' },
  audience: { label: 'Audience', icon: <UsersIcon />, color: '#10B981' },
  bidding: { label: 'Bidding', icon: <DollarIcon />, color: '#3B82F6' },
  placement: { label: 'Placement', icon: <LayoutIcon />, color: '#F59E0B' },
  copy: { label: 'Copy', icon: <TextIcon />, color: '#EC4899' },
  landing_page: { label: 'Landing Page', icon: <LinkIcon />, color: '#14B8A6' },
  schedule: { label: 'Schedule', icon: <ClockIcon />, color: '#6366F1' },
};

const priorityConfig: Record<TestPriority, { label: string; color: string; bgColor: string }> = {
  high: { label: 'High Priority', color: '#DC2626', bgColor: 'bg-red-50' },
  medium: { label: 'Medium', color: '#D97706', bgColor: 'bg-amber-50' },
  low: { label: 'Low', color: '#2563EB', bgColor: 'bg-blue-50' },
};

const generateRecommendations = (campaigns: CampaignData[]): ABTestRecommendation[] => {
  const recommendations: ABTestRecommendation[] = [];
  const testTypes: TestType[] = ['creative', 'audience', 'bidding', 'placement', 'copy'];
  const hypotheses: Record<string, string[]> = {
    creative: ['Video creatives will outperform static images', 'User-generated content style will increase engagement'],
    audience: ['Lookalike audiences based on high-LTV customers will convert better', 'Interest-based targeting will outperform behavioral targeting'],
    bidding: ['Target CPA bidding will reduce cost while maintaining volume', 'Bid cap strategy will improve ROAS'],
    placement: ['Stories placement will drive higher engagement than feed', 'Automatic placements will outperform manual selection'],
    copy: ['Urgency-driven headlines will improve CTR', 'Benefit-focused copy will outperform feature-focused'],
  };

  campaigns.filter(c => c.status === 'Active').forEach((campaign, idx) => {
    const testType = testTypes[idx % testTypes.length];
    const list = hypotheses[testType] || hypotheses.creative;
    const hypothesis = list[Math.floor(Math.random() * list.length)];
    const priority: TestPriority = campaign.healthScore < 60 ? 'high' : campaign.healthScore < 80 ? 'medium' : 'low';
    const variants: TestVariant[] = [
      { name: 'Control', description: 'Current configuration', expectedPerformance: 100 },
      { name: 'Variant A', description: 'Proposed change', expectedPerformance: 105 + Math.random() * 20 },
    ];

    recommendations.push({
      id: `test-${campaign.id}-0`, campaignId: campaign.id, campaignName: campaign.name, testType, hypothesis, variants,
      estimatedSampleSize: Math.floor(5000 + Math.random() * 15000), estimatedDuration: Math.floor(7 + Math.random() * 14),
      expectedLift: { min: Math.floor(5 + Math.random() * 10), max: Math.floor(15 + Math.random() * 20) },
      confidence: 0.85 + Math.random() * 0.1, priority,
      aiReasoning: `Analysis suggests ${testType} optimization could improve performance. ${campaign.healthScore < 70 ? 'Given current challenges, this test is prioritized.' : 'This could help maintain strong results.'}`,
      prerequisites: ['Ensure sufficient sample size', 'Set clear success metrics'],
    });
  });

  return recommendations.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]));
};

const ABTestRecommendations: React.FC<ABTestRecommendationsProps> = ({ campaigns, onClose, onStartTest, onAskAI }) => {
  const [recommendations] = useState<ABTestRecommendation[]>(() => generateRecommendations(campaigns));
  const [filterType, setFilterType] = useState<TestType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRecommendations = useMemo(() => {
    if (filterType === 'all') return recommendations;
    return recommendations.filter(r => r.testType === filterType);
  }, [recommendations, filterType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recommendations.forEach(r => { counts[r.testType] = (counts[r.testType] || 0) + 1; });
    return counts;
  }, [recommendations]);

  return (
    <div className="bg-white/95 rounded-2xl border border-gray-200 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
      <div className="px-6 py-5 bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskIcon />
          <div>
            <h3 className="text-lg font-semibold">A/B Test Recommendations</h3>
            <p className="text-sm opacity-90">{recommendations.filter(r => r.priority === 'high').length} high-priority tests suggested</p>
          </div>
        </div>
        {onClose && <button onClick={onClose} className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center"><CloseIcon /></button>}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 px-6 py-4 border-b border-gray-200 flex-wrap">
        <button onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${filterType === 'all' ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-gray-200 bg-white text-gray-500 hover:border-violet-400'}`}>
          All ({recommendations.length})
        </button>
        {Object.entries(testTypeConfig).map(([type, config]) => {
          const count = typeCounts[type] || 0;
          if (count === 0) return null;
          return (
            <button key={type} onClick={() => setFilterType(type as TestType)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${
                filterType === type ? 'border-current bg-opacity-10' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`} style={filterType === type ? { color: config.color, borderColor: config.color, background: `${config.color}10` } : undefined}>
              {config.icon} {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="max-h-[450px] overflow-y-auto">
        {filteredRecommendations.map((test) => {
          const typeConfig = testTypeConfig[test.testType];
          const prioConfig = priorityConfig[test.priority];
          const isExpanded = expandedId === test.id;

          return (
            <div key={test.id} className="px-6 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 last:border-b-0 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : test.id)}>
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${typeConfig.color}15`, color: typeConfig.color }}>{typeConfig.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded font-semibold" style={{ background: `${typeConfig.color}15`, color: typeConfig.color }}>{typeConfig.label}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${prioConfig.bgColor}`} style={{ color: prioConfig.color }}>{prioConfig.label}</span>
                    <span className="text-[11px] text-gray-400">{test.campaignName}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 leading-snug mb-2">{test.hypothesis}</h4>
                  <div className="flex gap-4 text-xs flex-wrap">
                    <div><span className="text-gray-400">Expected Lift: </span><span className="font-semibold text-emerald-500">+{test.expectedLift.min}-{test.expectedLift.max}%</span></div>
                    <div><span className="text-gray-400">Duration: </span><span className="font-medium text-gray-800">~{test.estimatedDuration} days</span></div>
                    <div><span className="text-gray-400">Sample: </span><span className="font-medium text-gray-800">{(test.estimatedSampleSize / 1000).toFixed(1)}K</span></div>
                    <div><span className="text-gray-400">Confidence: </span><span className="font-medium text-gray-800">{(test.confidence * 100).toFixed(0)}%</span></div>
                  </div>
                </div>
                <ChevronIcon isOpen={isExpanded} />
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold text-gray-500 mb-2">Test Variants</h5>
                    <div className="flex gap-3 flex-wrap">
                      {test.variants.map((variant, vIdx) => (
                        <div key={vIdx} className={`px-3.5 py-2.5 border rounded-lg min-w-[120px] ${vIdx === 0 ? 'bg-gray-50 border-gray-200' : 'border-gray-200'}`}
                          style={vIdx > 0 ? { background: `${typeConfig.color}08`, borderColor: `${typeConfig.color}30` } : undefined}>
                          <div className="text-sm font-semibold text-gray-800">{variant.name}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{variant.description}</div>
                          {variant.expectedPerformance && vIdx > 0 && <div className="text-[11px] text-emerald-500 mt-1 font-medium">+{(variant.expectedPerformance - 100).toFixed(0)}% expected</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-lg px-3.5 py-3 mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5"><SparkleIcon /><span className="text-[11px] font-semibold text-indigo-500">AI Reasoning</span></div>
                    <p className="text-sm text-indigo-800 leading-relaxed">{test.aiReasoning}</p>
                  </div>

                  {test.prerequisites && test.prerequisites.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-gray-500 mb-1.5">Prerequisites</h5>
                      <ul className="list-disc pl-4">{test.prerequisites.map((prereq, pIdx) => <li key={pIdx} className="text-xs text-gray-500 mb-0.5">{prereq}</li>)}</ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {onStartTest && (
                      <button onClick={() => onStartTest(test)}
                        className="px-4 py-2.5 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 hover:-translate-y-0.5 transition-all"
                        style={{ background: `linear-gradient(135deg, ${typeConfig.color}, ${typeConfig.color}dd)` }}>
                        <PlayIcon /> Start Test
                      </button>
                    )}
                    {onAskAI && (
                      <button onClick={() => onAskAI(`Provide detailed guidance for running a ${test.testType} A/B test for ${test.campaignName}. The hypothesis is: "${test.hypothesis}".`)}
                        className="px-4 py-2.5 bg-white text-indigo-500 border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50 hover:border-indigo-400 transition-all">
                        <SparkleIcon /> Get Setup Guide
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ABTestRecommendations;

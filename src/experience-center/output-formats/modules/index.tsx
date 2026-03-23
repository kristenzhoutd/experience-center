/**
 * Output Module Components — each renders one section of the output panel.
 *
 * Modules are composable and configurable via the module registry.
 * To add a new module:
 * 1. Create a component here
 * 2. Register it in moduleRegistry below
 * 3. Add the module key to scenario configs in scenarioRegistry.ts
 */

import type { OutputData } from '../../../stores/experienceLabStore';
import {
  OutputSection, HeroSummaryCard, KpiStatTile, SegmentCard,
  JourneyStageNode, ChannelRoleCard, DiagnosticFindingCard,
  PriorityActionRow, ImpactCalloutBox, ContextHeaderStrip,
  BriefSectionCard, SignalChipGroup,
  MetricStatCard, DeltaChip, ScoreBar, ChannelAllocationStrip,
  MiniSparkline, RankedScoreRow, TimelineStrip, SeverityIndicator,
} from '../primitives';
import { Sparkles, Lightbulb, Target, Send, ArrowRight, TrendingUp, BarChart3, Shield, Clock } from 'lucide-react';
import type { OutputModule } from '../../registry/types';

// ── Module Props ──

interface ModuleProps {
  output: OutputData;
  scenarioContext?: {
    outcome?: string;
    industry?: string;
    scenario?: string;
    kpi?: string;
  };
}

// ── Scenario Context Header ──

function ScenarioContextHeader({ scenarioContext }: ModuleProps) {
  if (!scenarioContext) return null;
  return <ContextHeaderStrip {...scenarioContext} />;
}

// ── Executive Summary ──

function ExecutiveSummaryModule({ output }: ModuleProps) {
  return (
    <OutputSection title="Executive Summary" icon={<Lightbulb className="w-4 h-4" />}>
      <div className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm">
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{output.executiveSummary}</div>
      </div>
    </OutputSection>
  );
}

// ── KPI Framework ──

function KpiFrameworkModule({ output }: ModuleProps) {
  // Generate illustrative sparkline values for each KPI
  const sparklineData = [
    [30, 35, 32, 40, 45, 48, 55, 62],
    [20, 22, 25, 23, 28, 30, 35, 38],
    [15, 18, 16, 20, 24, 22, 28, 32],
    [40, 38, 42, 45, 43, 48, 50, 55],
  ];
  const sparkColors: Array<'blue' | 'emerald' | 'amber'> = ['blue', 'emerald', 'amber', 'blue'];

  return (
    <OutputSection title="KPI Framework" icon={<TrendingUp className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {output.kpiFramework.map((kpi, i) => (
          <div key={i} className={`border rounded-xl p-3.5 ${
            kpi.type === 'Primary' ? 'border-blue-100 bg-blue-50/30' :
            kpi.type === 'Secondary' ? 'border-indigo-100 bg-indigo-50/30' :
            kpi.type === 'Leading Indicator' ? 'border-amber-100 bg-amber-50/30' :
            'border-emerald-100 bg-emerald-50/30'
          }`}>
            <div className="flex items-start justify-between mb-1">
              <div className={`text-[10px] font-semibold uppercase tracking-wider ${
                kpi.type === 'Primary' ? 'text-blue-600' :
                kpi.type === 'Secondary' ? 'text-indigo-500' :
                kpi.type === 'Leading Indicator' ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
                {kpi.type}
              </div>
              <MiniSparkline values={sparklineData[i] || sparklineData[0]} color={sparkColors[i] || 'blue'} height={20} />
            </div>
            <div className="text-sm font-semibold text-gray-900 mb-0.5">{kpi.name}</div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 flex-1">{kpi.note}</span>
              {i === 0 && <DeltaChip delta="+15-25%" trend="up" />}
            </div>
          </div>
        ))}
      </div>
    </OutputSection>
  );
}

// ── Campaign Brief ──

function CampaignBriefModule({ output }: ModuleProps) {
  return (
    <OutputSection title={output.scenarioCore.title || 'Campaign Brief'} icon={<Sparkles className="w-4 h-4" />}>
      <div className="space-y-2.5">
        {output.scenarioCore.sections.map((section, i) => (
          <BriefSectionCard key={i} label={section.label} content={section.content} />
        ))}
      </div>
    </OutputSection>
  );
}

// ── Journey Map ──

function JourneyMapModule({ output }: ModuleProps) {
  const stages = output.scenarioCore.sections;
  const durations = ['Day 0', '24h', '3 days', '7 days', '14 days'];

  return (
    <OutputSection title={output.scenarioCore.title || 'Lifecycle Journey'} icon={<ArrowRight className="w-4 h-4" />}>
      {/* Timeline overview strip */}
      <div className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm mb-3">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Journey Timeline</div>
        <TimelineStrip stages={stages.map((s, i) => ({
          label: s.label.replace(/^Stage \d+:\s*/, ''),
          duration: durations[i] || `${(i + 1) * 3} days`,
          active: true,
        }))} />
      </div>
      {/* Stage detail cards */}
      <div className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm">
        {stages.map((stage, i) => (
          <JourneyStageNode
            key={i}
            index={i}
            name={stage.label}
            content={stage.content}
            isLast={i === stages.length - 1}
          />
        ))}
      </div>
    </OutputSection>
  );
}

// ── Segment Cards ──

function SegmentCardsModule({ output }: ModuleProps) {
  const scoreValues = [85, 68, 45];
  const scoreColors: Array<'emerald' | 'blue' | 'amber'> = ['emerald', 'blue', 'amber'];

  return (
    <OutputSection title="Audience Segments" icon={<Target className="w-4 h-4" />}>
      <div className="space-y-2">
        {output.audienceCards.map((card, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3.5 bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="font-semibold text-sm text-gray-900">{card.name}</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                card.opportunityLevel === 'High' ? 'bg-emerald-50 text-emerald-700' :
                card.opportunityLevel === 'Medium' ? 'bg-amber-50 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {card.opportunityLevel}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">{card.whyItMatters}</p>
            {/* Opportunity score bar */}
            <div className="mb-2">
              <ScoreBar value={scoreValues[i] || 50} label="Score" color={scoreColors[i] || 'blue'} />
            </div>
            <p className="text-xs text-blue-600 font-medium">{card.suggestedAction}</p>
          </div>
        ))}
      </div>
    </OutputSection>
  );
}

// ── Performance Diagnosis ──

function PerformanceDiagnosisModule({ output }: ModuleProps) {
  const sections = output.scenarioCore.sections;
  const severityMap: Record<number, 'critical' | 'warning' | 'info'> = { 0: 'critical', 1: 'warning', 2: 'info', 3: 'info' };
  const severityLabels: Record<number, 'critical' | 'warning' | 'info' | 'success'> = { 0: 'critical', 1: 'warning', 2: 'info', 3: 'success' };

  return (
    <OutputSection title={output.scenarioCore.title || 'Performance Analysis'} icon={<BarChart3 className="w-4 h-4" />}>
      <div className="space-y-2.5">
        {sections.map((section, i) => (
          <div key={i} className={`bg-white border border-gray-100 border-l-4 ${
            severityMap[i] === 'critical' ? 'border-l-red-400' :
            severityMap[i] === 'warning' ? 'border-l-amber-400' : 'border-l-blue-400'
          } rounded-lg p-3.5`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{section.label}</h4>
              <SeverityIndicator level={severityLabels[i] || 'info'} />
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</div>
            {/* Impact score bar for diagnosis/recommendations */}
            {i <= 1 && (
              <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                <ScoreBar
                  value={i === 0 ? 78 : 55}
                  label="Impact"
                  color={i === 0 ? 'red' : 'amber'}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </OutputSection>
  );
}

// ── Next Actions ──

function NextActionsModule({ output }: ModuleProps) {
  return (
    <OutputSection title="Recommended Next Actions" icon={<ArrowRight className="w-4 h-4" />}>
      <div className="space-y-1.5">
        {output.nextActions.map((action, i) => (
          <PriorityActionRow key={i} index={i} action={action.action} priority={action.priority} />
        ))}
      </div>
    </OutputSection>
  );
}

// ── Audience Rationale ──

function AudienceRationaleModule({ output }: ModuleProps) {
  return (
    <OutputSection title="Audience Segments" icon={<Target className="w-4 h-4" />}>
      <div className="space-y-2">
        {output.audienceCards.map((card, i) => (
          <SegmentCard
            key={i}
            name={card.name}
            description={card.whyItMatters}
            level={card.opportunityLevel}
            action={card.suggestedAction}
          />
        ))}
      </div>
    </OutputSection>
  );
}

// ── Channel Strategy ──

function ChannelStrategyModule({ output }: ModuleProps) {
  const channelColors = ['blue', 'emerald', 'indigo', 'amber', 'pink'];
  const totalChannels = output.channelStrategy.length;
  // Generate allocation percentages (primary channel gets more)
  const allocations = output.channelStrategy.map((_, i) => {
    if (i === 0) return Math.round(60 / totalChannels * 2);
    return Math.round(40 / (totalChannels - 1));
  });
  const sum = allocations.reduce((a, b) => a + b, 0);
  if (sum !== 100 && allocations.length > 0) allocations[0] += 100 - sum;

  return (
    <OutputSection title="Channel Strategy" icon={<Send className="w-4 h-4" />}>
      {/* Channel allocation strip */}
      <div className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm mb-3">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Budget Allocation</div>
        <ChannelAllocationStrip
          channels={output.channelStrategy.map((ch, i) => ({
            name: ch.channel,
            percent: allocations[i],
            color: channelColors[i] || 'blue',
          }))}
        />
      </div>
      {/* Channel cards */}
      <div className="space-y-2">
        {output.channelStrategy.map((ch, i) => (
          <ChannelRoleCard
            key={i}
            channel={ch.channel}
            role={ch.role}
            messageAngle={ch.messageAngle}
            reason={ch.reason}
          />
        ))}
      </div>
    </OutputSection>
  );
}

// ── Insight Summary ──

function InsightSummaryModule({ output }: ModuleProps) {
  const sections = output.scenarioCore.sections;
  const confidenceScores = [92, 85, 78, 71];
  const sparkData = [
    [20, 25, 30, 35, 45, 50, 58, 65],
    [40, 38, 42, 48, 52, 55, 60, 62],
    [30, 32, 28, 35, 40, 38, 45, 50],
    [15, 20, 25, 30, 28, 35, 40, 48],
  ];

  return (
    <OutputSection title={output.scenarioCore.title || 'Insight Summary'} icon={<Lightbulb className="w-4 h-4" />}>
      <div className="space-y-2.5">
        {sections.map((section, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{section.label}</h4>
              </div>
              <div className="flex items-center gap-2">
                <MiniSparkline values={sparkData[i] || sparkData[0]} color="amber" height={18} />
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {confidenceScores[i] || 75}%
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-7">{section.content}</div>
          </div>
        ))}
      </div>
    </OutputSection>
  );
}

// ── Business Impact ──

function BusinessImpactModule({ output }: ModuleProps) {
  // Extract metric-like values from impact statements for stat cards
  const impacts = output.insightPanel.businessImpact;
  const trendIcons = [<TrendingUp className="w-3.5 h-3.5" />, <BarChart3 className="w-3.5 h-3.5" />, <Target className="w-3.5 h-3.5" />, <ArrowRight className="w-3.5 h-3.5" />];

  return (
    <OutputSection title="Projected Business Impact" icon={<TrendingUp className="w-4 h-4" />}>
      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-100 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {impacts.map((item, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-blue-100/50">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 mt-0.5">
                  {trendIcons[i] || trendIcons[0]}
                </div>
                <span className="text-sm text-blue-900/80 leading-relaxed">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OutputSection>
  );
}

// ── Insight Panel (Why + How Treasure Helps) ──

function InsightPanelModule({ output }: ModuleProps) {
  return (
    <OutputSection title="Why This Recommendation" icon={<Shield className="w-4 h-4" />}>
      <div className="bg-white rounded-xl p-4 border border-gray-200/60 shadow-sm space-y-4">
        <div className="text-sm text-gray-700 leading-relaxed">{output.insightPanel.whyThisRecommendation}</div>
        {output.insightPanel.whatChanged.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">How your selections shaped this output</div>
            <div className="space-y-1">
              {output.insightPanel.whatChanged.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
        {output.insightPanel.howTreasureHelps.length > 0 && (
          <SignalChipGroup signals={output.insightPanel.howTreasureHelps} label="Powered by Treasure AI" />
        )}
      </div>
    </OutputSection>
  );
}

// ════════════════════════════════════════════════════════════
// Module Registry — maps module keys to components
// ════════════════════════════════════════════════════════════

type ModuleComponent = (props: ModuleProps) => React.ReactNode;

export const moduleRegistry: Record<string, ModuleComponent> = {
  'scenario_context_header': ScenarioContextHeader,
  'executive_summary': ExecutiveSummaryModule,
  'kpi_framework': KpiFrameworkModule,
  'campaign_brief': CampaignBriefModule,
  'journey_map': JourneyMapModule,
  'segment_cards': SegmentCardsModule,
  'performance_diagnosis': PerformanceDiagnosisModule,
  'next_actions': NextActionsModule,
  'audience_rationale': AudienceRationaleModule,
  'channel_strategy': ChannelStrategyModule,
  'insight_summary': InsightSummaryModule,
  'business_impact': BusinessImpactModule,
  'insight_panel': InsightPanelModule,
};

// ════════════════════════════════════════════════════════════
// Output Compositions by format key
// ════════════════════════════════════════════════════════════

export const outputCompositions: Record<string, string[]> = {
  'campaign_brief': [
    'scenario_context_header',
    'executive_summary',
    'campaign_brief',
    'audience_rationale',
    'channel_strategy',
    'kpi_framework',
    'business_impact',
    'next_actions',
    'insight_panel',
  ],
  'journey_map': [
    'scenario_context_header',
    'executive_summary',
    'journey_map',
    'audience_rationale',
    'kpi_framework',
    'business_impact',
    'next_actions',
    'insight_panel',
  ],
  'segment_cards': [
    'scenario_context_header',
    'executive_summary',
    'segment_cards',
    'kpi_framework',
    'business_impact',
    'next_actions',
    'insight_panel',
  ],
  'performance_diagnosis': [
    'scenario_context_header',
    'executive_summary',
    'performance_diagnosis',
    'audience_rationale',
    'channel_strategy',
    'kpi_framework',
    'business_impact',
    'next_actions',
    'insight_panel',
  ],
  'insight_summary': [
    'scenario_context_header',
    'executive_summary',
    'insight_summary',
    'segment_cards',
    'kpi_framework',
    'business_impact',
    'next_actions',
    'insight_panel',
  ],
};

// Default composition if outputFormatKey not found
const DEFAULT_COMPOSITION = [
  'scenario_context_header',
  'executive_summary',
  'campaign_brief',
  'audience_rationale',
  'kpi_framework',
  'next_actions',
  'insight_panel',
];

// ════════════════════════════════════════════════════════════
// Modular Output Renderer
// ════════════════════════════════════════════════════════════

export function ModularOutputRenderer({ output, outputFormatKey, visibleSections, scenarioContext }: {
  output: OutputData;
  outputFormatKey?: string;
  visibleSections: number;
  scenarioContext?: ModuleProps['scenarioContext'];
}) {
  const composition = (outputFormatKey && outputCompositions[outputFormatKey]) || DEFAULT_COMPOSITION;

  return (
    <>
      {/* Hero summary — always first */}
      <div className={`transition-all duration-500 ${visibleSections > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <HeroSummaryCard
          headline={output.summaryBanner.topRecommendation}
          goal={output.summaryBanner.goal}
          audience={output.summaryBanner.audience}
          impact={output.summaryBanner.impactFraming}
        />
      </div>

      {/* Composable modules */}
      {composition.map((moduleKey, i) => {
        const Module = moduleRegistry[moduleKey];
        if (!Module) return null;
        return (
          <div
            key={moduleKey}
            className={`transition-all duration-500 ${visibleSections > i + 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <Module output={output} scenarioContext={scenarioContext} />
          </div>
        );
      })}

      {/* Trust footer */}
      <div className="mt-4 text-center text-[11px] text-gray-400">
        AI-generated recommendation designed for human review. Built on trusted, traceable context.
      </div>
    </>
  );
}

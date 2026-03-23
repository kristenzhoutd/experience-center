/**
 * Reusable visual primitives for Experience Center output modules.
 * These form the shared design system across all output formats.
 */

import { Sparkles, TrendingUp, Target, ArrowRight, AlertTriangle, Zap, BarChart3, ArrowUp, ArrowDown, Minus } from 'lucide-react';

// ── Section Wrapper ──

export function OutputSection({ title, icon, children, className = '' }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 ${className}`}>
      <div className="flex items-center gap-2 mb-2.5">
        {icon && <div className="text-gray-400">{icon}</div>}
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Hero Summary Card ──

export function HeroSummaryCard({ headline, supporting, goal, audience, impact, label = 'AI-Generated Recommendation' }: {
  headline: string;
  supporting?: string;
  goal?: string;
  audience?: string;
  impact?: string;
  label?: string;
}) {
  return (
    <div className="border border-gray-200/60 rounded-2xl p-5 mb-5 bg-white shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</div>
          <div className="text-sm font-semibold text-gray-900 leading-snug">{headline}</div>
          {supporting && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{supporting}</p>}
        </div>
      </div>
      {(goal || audience) && (
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
          {goal && <span>Goal: {goal}</span>}
          {goal && audience && <span className="w-1 h-1 rounded-full bg-gray-300" />}
          {audience && <span>Audience: {audience}</span>}
        </div>
      )}
      {impact && <div className="mt-1.5 text-sm text-blue-600 font-medium">{impact}</div>}
    </div>
  );
}

// ── KPI Stat Tile ──

const KPI_COLORS: Record<string, string> = {
  'Primary': 'text-blue-600 border-blue-100 bg-blue-50/40',
  'Secondary': 'text-indigo-500 border-indigo-100 bg-indigo-50/40',
  'Leading Indicator': 'text-amber-600 border-amber-100 bg-amber-50/40',
  'Optimization': 'text-emerald-600 border-emerald-100 bg-emerald-50/40',
};

export function KpiStatTile({ type, name, note }: { type: string; name: string; note: string }) {
  const colorClass = KPI_COLORS[type] || 'text-gray-500 border-gray-100 bg-gray-50/40';
  return (
    <div className={`border rounded-xl p-3.5 ${colorClass}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1">{type}</div>
      <div className="text-sm font-semibold text-gray-900 mb-0.5">{name}</div>
      <div className="text-[11px] text-gray-500">{note}</div>
    </div>
  );
}

// ── Ranked Segment Card ──

const LEVEL_COLORS: Record<string, string> = {
  'High': 'bg-green-50 text-green-700',
  'Medium': 'bg-amber-50 text-amber-700',
  'Low': 'bg-gray-100 text-gray-500',
};

export function SegmentCard({ name, description, level, action, rank }: {
  name: string;
  description: string;
  level: string;
  action: string;
  rank?: number;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-3.5 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {rank !== undefined && (
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {rank}
            </span>
          )}
          <span className="font-semibold text-sm text-gray-900">{name}</span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[level] || LEVEL_COLORS['Low']}`}>
          {level}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">{description}</p>
      <p className="text-xs text-blue-600 font-medium">{action}</p>
    </div>
  );
}

// ── Journey Stage Node ──

export function JourneyStageNode({ index, name, content, isLast = false }: {
  index: number;
  name: string;
  content: string;
  isLast?: boolean;
}) {
  const lines = content.split('\n').filter(l => l.trim());
  return (
    <div className="flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
          {index + 1}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-blue-100 mt-1" />}
      </div>
      {/* Stage content */}
      <div className={`flex-1 bg-white border border-gray-100 rounded-xl p-3.5 ${!isLast ? 'mb-2' : ''}`}>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{name}</h4>
        <div className="space-y-1">
          {lines.map((line, i) => {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            return value ? (
              <div key={i} className="text-xs">
                <span className="text-gray-400 font-medium">{key.trim()}:</span>{' '}
                <span className="text-gray-700">{value}</span>
              </div>
            ) : (
              <p key={i} className="text-xs text-gray-700">{line}</p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Channel Role Card ──

export function ChannelRoleCard({ channel, role, messageAngle, reason }: {
  channel: string;
  role: string;
  messageAngle: string;
  reason: string;
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-3.5 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <span className="text-sm font-semibold text-gray-900">{channel}</span>
        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-auto">{role}</span>
      </div>
      <p className="text-xs text-gray-700 mb-1">{messageAngle}</p>
      <p className="text-[11px] text-gray-400 italic">{reason}</p>
    </div>
  );
}

// ── Diagnostic Finding Card ──

export function DiagnosticFindingCard({ label, content, severity }: {
  label: string;
  content: string;
  severity?: 'critical' | 'warning' | 'info';
}) {
  const borderColor = severity === 'critical' ? 'border-l-red-400' : severity === 'warning' ? 'border-l-amber-400' : 'border-l-blue-400';
  return (
    <div className={`bg-white border border-gray-100 border-l-4 ${borderColor} rounded-lg p-3.5`}>
      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</h4>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
    </div>
  );
}

// ── Priority Action Row ──

const PRIORITY_COLORS: Record<string, string> = {
  'Do now': 'bg-green-50 text-green-700 border-green-200',
  'Test next': 'bg-blue-50 text-blue-700 border-blue-200',
  'Scale later': 'bg-gray-50 text-gray-500 border-gray-200',
};

export function PriorityActionRow({ action, priority, index }: { action: string; priority: string; index: number }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {index + 1}
      </span>
      <span className="text-sm text-gray-700 flex-1">{action}</span>
      <span className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${PRIORITY_COLORS[priority] || PRIORITY_COLORS['Scale later']}`}>
        {priority}
      </span>
    </div>
  );
}

// ── Signal Chip Group ──

export function SignalChipGroup({ signals, label = 'Data Signals' }: { signals: string[]; label?: string }) {
  return (
    <div>
      {label && <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">{label}</div>}
      <div className="flex flex-wrap gap-1.5">
        {signals.map((s, i) => (
          <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-600">{s}</span>
        ))}
      </div>
    </div>
  );
}

// ── Impact Callout Box ──

export function ImpactCalloutBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
            <span className="text-sm text-blue-900/80">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Context Header Strip ──

export function ContextHeaderStrip({ outcome, industry, scenario, kpi }: {
  outcome?: string;
  industry?: string;
  scenario?: string;
  kpi?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-gray-100">
      {outcome && <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{outcome}</span>}
      {industry && <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">{industry}</span>}
      {scenario && <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{scenario}</span>}
      {kpi && (
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1 ml-auto">
          <Target className="w-3 h-3" />
          {kpi}
        </span>
      )}
    </div>
  );
}

// ── Brief Section Card ──

export function BriefSectionCard({ label, content }: { label: string; content: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</h4>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</div>
    </div>
  );
}

// ── Comparison Card ──

export function ComparisonCard({ labelA, labelB, valueA, valueB, metric }: {
  labelA: string;
  labelB: string;
  valueA: string;
  valueB: string;
  metric: string;
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3.5 pt-3 pb-1">{metric}</div>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="p-3.5">
          <div className="text-[10px] text-gray-400 mb-1">{labelA}</div>
          <div className="text-sm font-semibold text-gray-900">{valueA}</div>
        </div>
        <div className="p-3.5">
          <div className="text-[10px] text-gray-400 mb-1">{labelB}</div>
          <div className="text-sm font-semibold text-blue-600">{valueB}</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DATA VISUALIZATION PRIMITIVES
// Inspired by Paid Media Command Center design language
// ════════════════════════════════════════════════════════════

// ── Metric Stat Card (Command Center style) ──

export function MetricStatCard({ label, value, delta, trend, icon }: {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
        {icon && <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-gray-900">{value}</span>
        {delta && (
          <DeltaChip delta={delta} trend={trend} />
        )}
      </div>
    </div>
  );
}

// ── Delta Chip ──

export function DeltaChip({ delta, trend = 'up' }: { delta: string; trend?: 'up' | 'down' | 'flat' }) {
  const color = trend === 'up' ? 'text-emerald-600 bg-emerald-50' : trend === 'down' ? 'text-red-500 bg-red-50' : 'text-gray-500 bg-gray-50';
  const Icon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      {delta}
    </span>
  );
}

// ── Score Bar (horizontal progress) ──

export function ScoreBar({ value, max = 100, label, color = 'blue' }: {
  value: number;
  max?: number;
  label?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo';
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColors: Record<string, string> = {
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    indigo: 'bg-indigo-400',
  };
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] text-gray-400 w-16 flex-shrink-0 truncate">{label}</span>}
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColors[color]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}

// ── Channel Allocation Strip ──

export function ChannelAllocationStrip({ channels }: {
  channels: Array<{ name: string; percent: number; color: string }>;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400',
    indigo: 'bg-indigo-400', pink: 'bg-pink-400', purple: 'bg-purple-400',
  };
  return (
    <div>
      <div className="h-2.5 rounded-full overflow-hidden flex">
        {channels.map((ch, i) => (
          <div
            key={i}
            className={`h-full transition-all duration-700 ${colors[ch.color] || 'bg-gray-300'} ${i === 0 ? 'rounded-l-full' : ''} ${i === channels.length - 1 ? 'rounded-r-full' : ''}`}
            style={{ width: `${ch.percent}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {channels.map((ch, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${colors[ch.color] || 'bg-gray-300'}`} />
            <span className="text-[10px] text-gray-500">{ch.name}</span>
            <span className="text-[10px] font-semibold text-gray-700">{ch.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini Sparkline (CSS-only) ──

export function MiniSparkline({ values, color = 'blue', height = 24 }: {
  values: number[];
  color?: 'blue' | 'emerald' | 'amber';
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const barColors = { blue: 'bg-blue-300', emerald: 'bg-emerald-300', amber: 'bg-amber-300' };

  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm ${barColors[color]} opacity-70`}
          style={{ height: `${Math.max(8, ((v - min) / range) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ── Ranked Score Row ──

export function RankedScoreRow({ rank, label, score, maxScore = 100, color = 'blue' }: {
  rank: number;
  label: string;
  score: number;
  maxScore?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'indigo';
}) {
  const pct = Math.min(100, (score / maxScore) * 100);
  const barColors: Record<string, string> = {
    blue: 'bg-blue-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400', indigo: 'bg-indigo-400',
  };
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{rank}</span>
      <span className="text-xs text-gray-700 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColors[color]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

// ── Timeline Strip ──

export function TimelineStrip({ stages }: {
  stages: Array<{ label: string; duration: string; active?: boolean }>;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {stages.map((stage, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div className={`w-full h-1.5 rounded-full ${stage.active ? 'bg-blue-400' : 'bg-gray-200'}`} />
          <span className="text-[9px] text-gray-500 mt-1 text-center leading-tight">{stage.label}</span>
          <span className="text-[9px] text-gray-400">{stage.duration}</span>
        </div>
      ))}
    </div>
  );
}

// ── Severity Indicator ──

export function SeverityIndicator({ level }: { level: 'critical' | 'warning' | 'info' | 'success' }) {
  const config = {
    critical: { color: 'bg-red-500', label: 'Critical', bg: 'bg-red-50 text-red-700' },
    warning: { color: 'bg-amber-500', label: 'Warning', bg: 'bg-amber-50 text-amber-700' },
    info: { color: 'bg-blue-500', label: 'Info', bg: 'bg-blue-50 text-blue-700' },
    success: { color: 'bg-emerald-500', label: 'Healthy', bg: 'bg-emerald-50 text-emerald-700' },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
      {c.label}
    </span>
  );
}

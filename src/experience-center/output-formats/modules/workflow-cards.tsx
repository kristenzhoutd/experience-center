/**
 * Workflow Step Cards — one cohesive card per workflow step type.
 * Each card maps directly to its step-specific LLM output schema.
 */

import { Search, BarChart3, FileText, Zap, Target, TrendingUp, Users } from 'lucide-react';
import type { StepType } from '../../orchestration/types';

interface StepCardProps {
  output: Record<string, any>;
  stepLabel: string;
}

// ── Shared primitives ──

function CardShell({ icon, typeLabel, children }: { icon: React.ReactNode; typeLabel: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{typeLabel}</span>
      </div>
      {children}
    </div>
  );
}

function Headline({ text }: { text: string }) {
  return (
    <h3 className="text-base font-semibold text-gray-900 leading-snug mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {text}
    </h3>
  );
}

function ImpactCallout({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mt-4 bg-blue-50/50 border border-blue-100/60 rounded-xl px-4 py-3 flex items-start gap-2">
      <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-blue-700 font-medium leading-snug">{text}</span>
    </div>
  );
}

function MetricRow({ metrics }: { metrics: Array<{ label: string; value: string }> }) {
  if (!metrics?.length) return null;
  return (
    <div className="flex gap-3 mt-4">
      {metrics.map((m, i) => (
        <div key={i} className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
          <div className="text-sm font-bold text-gray-900">{m.value}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{m.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Analysis Card ── (schema: headline, impactStatement, findings[], metrics[], rationale)

function AnalysisCard({ output }: StepCardProps) {
  const findings = Array.isArray(output.findings) ? output.findings : [];
  const metrics = Array.isArray(output.metrics) ? output.metrics : [];

  return (
    <CardShell icon={<Search className="w-4 h-4 text-blue-500" />} typeLabel="Analysis">
      <Headline text={output.headline || 'Analysis complete'} />

      {findings.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Key Findings</div>
          {findings.map((f: any, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold ${
                f.level === 'High' ? 'bg-emerald-50 text-emerald-600' :
                f.level === 'Medium' ? 'bg-amber-50 text-amber-600' :
                'bg-gray-100 text-gray-500'
              }`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">{f.name}</span>
                <span className="text-sm text-gray-400"> — </span>
                <span className="text-sm text-gray-500">{f.insight}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <MetricRow metrics={metrics} />

      {output.rationale && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">{output.rationale}</p>
      )}

      <ImpactCallout text={output.impactStatement || ''} />
    </CardShell>
  );
}

// ── Profile Inspection Card ── (schema: headline, impactStatement, profiles[], sections[])

function ProfileInspectionCard({ output }: StepCardProps) {
  const profiles = Array.isArray(output.profiles) ? output.profiles : [];
  const sections = Array.isArray(output.sections) ? output.sections : [];

  return (
    <CardShell icon={<Users className="w-4 h-4 text-blue-500" />} typeLabel="Profile Inspection">
      <Headline text={output.headline || 'Profile inspection complete'} />

      {profiles.length > 0 && (
        <div className="space-y-3 mb-4">
          {profiles.map((p: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                <span className={`text-[10px] font-semibold ${
                  p.level === 'High' ? 'text-emerald-600' : p.level === 'Medium' ? 'text-amber-600' : 'text-gray-400'
                }`}>{p.level}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{p.behavior}</p>
              <p className="text-xs text-blue-600 font-medium mt-1.5">{p.action}</p>
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && (
        <div className="space-y-2">
          {sections.map((s: any, i: number) => (
            <div key={i}>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
              <p className="text-xs text-gray-600 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      )}

      <ImpactCallout text={output.impactStatement || ''} />
    </CardShell>
  );
}

// ── Creation Card ── (schema: headline, impactStatement, sections[], channels[], nextSteps[])

function CreationCard({ output, stepLabel }: StepCardProps) {
  const sections = Array.isArray(output.sections) ? output.sections : [];
  const channels = Array.isArray(output.channels) ? output.channels : [];
  const nextSteps = Array.isArray(output.nextSteps) ? output.nextSteps : [];
  const isJourney = stepLabel.toLowerCase().includes('journey');

  return (
    <CardShell
      icon={<FileText className="w-4 h-4 text-blue-500" />}
      typeLabel={isJourney ? 'Journey' : 'Campaign Plan'}
    >
      <Headline text={output.headline || stepLabel} />

      {sections.length > 0 && (
        <div className="space-y-3 mb-4">
          {sections.map((s: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
              <p className="text-sm text-gray-700 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      )}

      {channels.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Channels</div>
          <div className="flex flex-wrap gap-1.5">
            {channels.map((ch: any, i: number) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                {ch.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Next Steps</div>
          <div className="space-y-1.5">
            {nextSteps.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                  a.priority === 'Do now' ? 'bg-emerald-50 text-emerald-700' :
                  a.priority === 'Test next' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{a.priority}</span>
                <span className="text-xs text-gray-600">{a.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ImpactCallout text={output.impactStatement || ''} />
    </CardShell>
  );
}

// ── Comparison Card ── (schema: headline, impactStatement, options[], metrics[])

function ComparisonCard({ output }: StepCardProps) {
  const options = Array.isArray(output.options) ? output.options : [];
  const metrics = Array.isArray(output.metrics) ? output.metrics : [];

  return (
    <CardShell icon={<BarChart3 className="w-4 h-4 text-blue-500" />} typeLabel="Comparison">
      <Headline text={output.headline || 'Comparison complete'} />

      {options.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          {options.map((opt: any, i: number) => (
            <div key={i} className={`rounded-xl p-3.5 border ${
              opt.recommended ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-900">{opt.name}</span>
                {opt.recommended && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">Top</span>}
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-1">{opt.description}</p>
              <p className="text-[11px] text-blue-600 font-medium">{opt.score}</p>
            </div>
          ))}
        </div>
      )}

      <MetricRow metrics={metrics} />
      <ImpactCallout text={output.impactStatement || ''} />
    </CardShell>
  );
}

// ── Activation Card ── (schema: headline, impactStatement, summary, destinations[], sections[])

function ActivationCard({ output }: StepCardProps) {
  const destinations = Array.isArray(output.destinations) ? output.destinations : [];
  const sections = Array.isArray(output.sections) ? output.sections : [];

  return (
    <CardShell icon={<Zap className="w-4 h-4 text-blue-500" />} typeLabel="Activation Preview">
      <Headline text={output.headline || 'Activation ready'} />

      {output.summary && <p className="text-sm text-gray-500 leading-relaxed mb-4">{output.summary}</p>}

      {destinations.length > 0 && (
        <div className="space-y-2 mb-3">
          {destinations.map((d: any, i: number) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
              <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{d.channel}</span>
                <span className="text-sm text-gray-400"> — </span>
                <span className="text-xs text-gray-500">{d.role}</span>
                {d.detail && <p className="text-xs text-gray-400 mt-0.5">{d.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {sections.map((s: any, i: number) => (
        <div key={i} className="mb-2">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
          <p className="text-xs text-gray-600 leading-relaxed">{s.content}</p>
        </div>
      ))}

      <ImpactCallout text={output.impactStatement || ''} />
    </CardShell>
  );
}

// ── Optimization Card ── (schema: headline, impactStatement, rationale, metrics[], changes[])

function OptimizationCard({ output }: StepCardProps) {
  const metrics = Array.isArray(output.metrics) ? output.metrics : [];
  const changes = Array.isArray(output.changes) ? output.changes : [];

  return (
    <CardShell icon={<Target className="w-4 h-4 text-blue-500" />} typeLabel="Optimization">
      <Headline text={output.headline || 'Optimization recommendations'} />

      {output.rationale && (
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{output.rationale}</p>
      )}

      <MetricRow metrics={metrics} />

      {changes.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Changes</div>
          <div className="space-y-1.5">
            {changes.map((c: any, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                  c.priority === 'Do now' ? 'bg-emerald-50 text-emerald-700' :
                  c.priority === 'Test next' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{c.priority}</span>
                <span className="text-xs text-gray-600">{c.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ImpactCallout text={output.impactStatement || ''} />
    </CardShell>
  );
}

// ── Step Card Registry & Dispatcher ──

const stepCardRegistry: Record<StepType, React.FC<StepCardProps>> = {
  analyze: AnalysisCard,
  inspect: ProfileInspectionCard,
  create: CreationCard,
  compare: ComparisonCard,
  activate: ActivationCard,
  optimize: OptimizationCard,
};

export default function WorkflowStepCard({ stepType, output, stepLabel, stepNumber }: {
  stepType: StepType;
  output: Record<string, any>;
  stepLabel: string;
  stepNumber: number;
}) {
  const Card = stepCardRegistry[stepType] || AnalysisCard;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] font-bold text-blue-600">{stepNumber}</span>
        </div>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{stepLabel}</span>
      </div>
      <Card output={output} stepLabel={stepLabel} />
    </div>
  );
}

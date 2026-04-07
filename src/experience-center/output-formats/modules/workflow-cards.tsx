/**
 * Workflow Step Cards — one cohesive card per workflow step type.
 * Each card maps directly to its step-specific LLM output schema.
 */

import { Search, BarChart3, FileText, Zap, Target, TrendingUp, Users, Clock, GitBranch, Circle, Send, Mail, Smartphone, Monitor, Globe } from 'lucide-react';
import type { StepType } from '../../orchestration/types';

interface StepCardProps {
  output: Record<string, any>;
  stepLabel: string;
  stepNumber?: number;
}

// ── Shared primitives ──

function CardShell({ icon, typeLabel, stepNumber, stepLabel, children }: {
  icon: React.ReactNode;
  typeLabel: string;
  stepNumber?: number;
  stepLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-5">
      {stepNumber != null && stepLabel && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-blue-600">{stepNumber}</span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{stepLabel}</span>
        </div>
      )}
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

function AnalysisCard({ output, stepLabel, stepNumber }: StepCardProps) {
  const findings = Array.isArray(output.findings) ? output.findings : [];
  const metrics = Array.isArray(output.metrics) ? output.metrics : [];

  return (
    <CardShell icon={<Search className="w-4 h-4 text-blue-500" />} typeLabel="Analysis" stepNumber={stepNumber} stepLabel={stepLabel}>
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

function ProfileInspectionCard({ output, stepLabel, stepNumber }: StepCardProps) {
  const profiles = Array.isArray(output.profiles) ? output.profiles : [];
  const sections = Array.isArray(output.sections) ? output.sections : [];

  return (
    <CardShell icon={<Users className="w-4 h-4 text-blue-500" />} typeLabel="Profile Inspection" stepNumber={stepNumber} stepLabel={stepLabel}>
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

function CreationCard({ output, stepLabel, stepNumber }: StepCardProps) {
  const sections = Array.isArray(output.sections) ? output.sections : [];
  const channels = Array.isArray(output.channels) ? output.channels : [];
  const nextSteps = Array.isArray(output.nextSteps) ? output.nextSteps : [];
  const isJourney = stepLabel.toLowerCase().includes('journey');

  return (
    <CardShell
      icon={<FileText className="w-4 h-4 text-blue-500" />}
      typeLabel={isJourney ? 'Journey' : 'Campaign Plan'}
      stepNumber={stepNumber}
      stepLabel={stepLabel}
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

function ComparisonCard({ output, stepLabel, stepNumber }: StepCardProps) {
  const options = Array.isArray(output.options) ? output.options : [];
  const metrics = Array.isArray(output.metrics) ? output.metrics : [];

  return (
    <CardShell icon={<BarChart3 className="w-4 h-4 text-blue-500" />} typeLabel="Comparison" stepNumber={stepNumber} stepLabel={stepLabel}>
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

function ActivationCard({ output, stepLabel, stepNumber }: StepCardProps) {
  const destinations = Array.isArray(output.destinations) ? output.destinations : [];
  const sections = Array.isArray(output.sections) ? output.sections : [];

  return (
    <CardShell icon={<Zap className="w-4 h-4 text-blue-500" />} typeLabel="Activation Preview" stepNumber={stepNumber} stepLabel={stepLabel}>
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

function OptimizationCard({ output, stepLabel, stepNumber }: StepCardProps) {
  const metrics = Array.isArray(output.metrics) ? output.metrics : [];
  const changes = Array.isArray(output.changes) ? output.changes : [];

  return (
    <CardShell icon={<Target className="w-4 h-4 text-blue-500" />} typeLabel="Optimization" stepNumber={stepNumber} stepLabel={stepLabel}>
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

// ── Journey Card ── (TD Journey Editor style)
// Horizontal flow matching Treasure Data Audience Studio Journey Editor:
// - Stages stacked vertically, large light heading + milestone pill
// - Nodes: circular (48px) for most types, rotated diamond for decision
// - Horizontal dashed connectors between nodes
// - Decision branches fan out vertically with condition badges

const NODE_SIZE = 48;
const NODE_WIDTH = 90;
const DASH_W = 40;

// TD SVG icons (from Audience Studio)
const JI = {
  activation: <svg height="22" viewBox="4 4 16 16" width="22" fill="currentColor"><path d="M20.72 3.302a1.1 1.1 0 0 1-.001 1.555L18.902 6.67a5 5 0 0 1-.47 6.54l-1.62 1.614a.5.5 0 0 1-.706-.001L9.189 7.887a.5.5 0 0 1 0-.707l1.62-1.614a5 5 0 0 1 6.54-.454L19.164 3.3a1.1 1.1 0 0 1 1.556.002M3.252 20.726a1.1 1.1 0 0 0 1.555.002L6.56 18.98a5 5 0 0 0 6.54-.454l1.422-1.418a.5.5 0 0 0 .001-.708L7.606 9.466a.5.5 0 0 0-.707-.001l-1.422 1.418a5 5 0 0 0-.47 6.539L3.254 19.17a1.1 1.1 0 0 0-.002 1.556" /></svg>,
  wait: <svg height="22" viewBox="4 4 16 16" width="22" fill="currentColor"><path d="M12 5.99a6 6 0 1 0 5.752 7.714 1 1 0 1 1 1.917.57 8 8 0 1 1-2.38-8.287l.851-.851a.46.46 0 0 1 .786.326V8.54a.46.46 0 0 1-.46.46h-3.079a.46.46 0 0 1-.325-.786l.81-.809A5.97 5.97 0 0 0 12 5.989" /><path d="M12.687 8.99a1 1 0 1 0-2 0v4a1 1 0 0 0 1 1h4a1 1 0 1 0 0-2h-3z" /></svg>,
  decision: <svg height="18" viewBox="0 0 24 24" width="18" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M16.4565 1.36574C17.0277 0.84463 17.9132 0.885249 18.4343 1.45646L21.1269 4.40794C21.7886 5.13337 21.7886 6.24357 21.1269 6.969L18.4343 9.92048C17.9132 10.4917 17.0277 10.5323 16.4565 10.0112C15.8852 9.4901 15.8446 8.6046 16.3657 8.03339L17.2278 7.08847H1.4C0.626801 7.08847 0 6.46167 0 5.68847C0 4.91527 0.626801 4.28847 1.4 4.28847H17.2278L16.3657 3.34356C15.8446 2.77234 15.8852 1.88684 16.4565 1.36574ZM9.8 10.0731V8.67309H7V10.0731V14.8423C7 17.8247 9.41766 20.2423 12.4 20.2423H17.2278L16.3657 21.1872C15.8446 21.7584 15.8852 22.6439 16.4565 23.1651C17.0277 23.6862 17.9132 23.6455 18.4343 23.0743L21.1269 20.1228C21.7886 19.3974 21.7886 18.2872 21.1269 17.5618L18.4343 14.6103C17.9132 14.0391 17.0277 13.9985 16.4565 14.5196C15.8852 15.0407 15.8446 15.9262 16.3657 16.4974L17.2278 17.4423H12.4C10.9641 17.4423 9.8 16.2783 9.8 14.8423V10.0731Z" /></svg>,
  entry: <svg height="22" viewBox="4 4 16 16" width="22" fill="currentColor"><path d="M8.378 12.434a1 1 0 1 0 0-2 1 1 0 0 0 0 2M11.47 10.434a1 1 0 1 0 0 2h4.152a1 1 0 1 0 0-2zM8.378 15.934a1 1 0 1 0 0-2 1 1 0 0 0 0 2M11.47 13.934a1 1 0 1 0 0 2h4.152a1 1 0 1 0 0-2z" /><path d="M6 4.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-11a2 2 0 0 0-2-2zm-.3 4.122a.5.5 0 0 1 .5-.5h11.6a.5.5 0 0 1 .5.5V17.5a.3.3 0 0 1-.3.3H6a.3.3 0 0 1-.3-.3z" fillRule="evenodd" /></svg>,
  end: <svg height="22" viewBox="4 4 16 16" width="22" fill="currentColor"><path d="M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0m-2.5 0a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" fillRule="evenodd" /></svg>,
  milestone: <svg height="14" viewBox="4 4 16 16" width="14" fill="currentColor"><path d="M7.327 19a1 1 0 1 0 2 0v-6.151l7.063-3.398a.5.5 0 0 0 0-.902L9.327 5.151V5a1 1 0 1 0-2 0z" /></svg>,
};

// Circular node (entry, activation, wait, end)
function JNode({ icon, label, bg, fg }: { icon: React.ReactNode; label: string; bg: string; fg: string }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: NODE_WIDTH }}>
      <div className={`rounded-full ${bg} flex items-center justify-center`} style={{ width: NODE_SIZE, height: NODE_SIZE }}>
        <div className={fg}>{icon}</div>
      </div>
      <span className="text-[11px] text-gray-600 text-center mt-1.5 leading-tight" style={{ maxWidth: NODE_WIDTH, wordBreak: 'break-word' }}>{label}</span>
    </div>
  );
}

// Diamond node (decision point) — rotated 45deg square
function JDiamond({ label }: { label: string }) {
  const diamondSize = 36;
  return (
    <div className="flex flex-col items-center flex-shrink-0" style={{ width: NODE_WIDTH }}>
      <div className="flex items-center justify-center" style={{ width: NODE_SIZE, height: NODE_SIZE }}>
        <div
          className="bg-amber-50 border-2 border-amber-300 flex items-center justify-center"
          style={{ width: diamondSize, height: diamondSize, transform: 'rotate(45deg)', borderRadius: 6 }}
        >
          <div className="text-amber-600" style={{ transform: 'rotate(-45deg)' }}>{JI.decision}</div>
        </div>
      </div>
      <span className="text-[11px] text-gray-600 text-center mt-1.5 leading-tight" style={{ maxWidth: NODE_WIDTH }}>{label}</span>
    </div>
  );
}

// Horizontal dashed line connector
function JDash() {
  return (
    <div className="flex items-center flex-shrink-0" style={{ width: DASH_W, height: NODE_SIZE }}>
      <div className="w-full border-t-[1.5px] border-dashed border-gray-300" />
    </div>
  );
}

// A single branch row: vertical dashed → condition badge → horizontal dashed → step nodes
function JBranchRow({ branch }: { branch: any }) {
  const steps = Array.isArray(branch.steps) ? branch.steps : [];
  return (
    <div className="flex items-start">
      {/* Condition badge — vertically centered with the node circles, gaps on both sides */}
      <div className="flex items-center flex-shrink-0" style={{ height: NODE_SIZE, gap: 10 }}>
        <div className="border-t-[1.5px] border-dashed border-gray-300 flex-shrink-0" style={{ width: DASH_W }} />
        <div className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <span className="text-[11px] font-medium text-blue-600 whitespace-nowrap">{branch.condition}</span>
        </div>
        <div className="border-t-[1.5px] border-dashed border-gray-300 flex-shrink-0" style={{ width: DASH_W }} />
      </div>
      {/* Steps in this branch — top-aligned so circles match main flow */}
      {steps.map((bs: any, si: number) => (
        <div key={si} className="flex items-start">
          {si > 0 && <div className="flex items-center flex-shrink-0" style={{ width: DASH_W, height: NODE_SIZE }}>
            <div className="w-full border-t-[1.5px] border-dashed border-gray-300" />
          </div>}
          {bs.type === 'end'
            ? <JNode icon={JI.end} label={bs.label || 'End'} bg="bg-gray-50" fg="text-indigo-300" />
            : <JNode icon={JI.activation} label={bs.label} bg="bg-emerald-50" fg="text-emerald-600" />
          }
        </div>
      ))}
      {steps.length === 0 && (
        <JNode icon={JI.end} label="End" bg="bg-gray-50" fg="text-indigo-300" />
      )}
    </div>
  );
}

// Horizontal step flow with inline decision branching
function JStepFlow({ steps }: { steps: any[] }) {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const t = s.type || 'activation';
    if (i > 0) items.push(<JDash key={`d${i}`} />);

    if (t === 'decision') {
      const branches = Array.isArray(s.branches) ? s.branches : [];
      items.push(
        <div key={`s${i}`} className="flex-shrink-0">
          {/* First branch inline with diamond, aligned to main flow center */}
          <div className="flex items-start">
            <JDiamond label={s.label || 'Decision point'} />
            {branches.length > 0 && (
              <div className="flex flex-col">
                {/* First branch: top-aligned so its nodes match the main icon row */}
                <div style={{ marginTop: 0 }}>
                  <JBranchRow branch={branches[0]} />
                </div>
                {/* Additional branches below */}
                {branches.slice(1).map((b: any, bi: number) => (
                  <div key={bi} style={{ marginTop: 16 }}>
                    <JBranchRow branch={b} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else if (t === 'wait') {
      items.push(<JNode key={`s${i}`} icon={JI.wait} label={s.label} bg="bg-gray-100" fg="text-gray-500" />);
    } else if (t === 'end') {
      items.push(<JNode key={`s${i}`} icon={JI.end} label={s.label || 'End'} bg="bg-gray-50" fg="text-indigo-300" />);
    } else {
      items.push(<JNode key={`s${i}`} icon={JI.activation} label={s.label} bg="bg-emerald-50" fg="text-emerald-600" />);
    }
  }
  return <div className="flex items-start">{items}</div>;
}

function JourneyCard({ output, stepLabel, stepNumber }: StepCardProps) {
  const stages = Array.isArray(output.stages) ? output.stages : [];

  return (
    <CardShell
      icon={<GitBranch className="w-4 h-4 text-blue-500" />}
      typeLabel="Journey"
      stepNumber={stepNumber}
      stepLabel={stepLabel}
    >
      <Headline text={output.headline || stepLabel} />

      {/* Dotted background container */}
      <div className="relative rounded-xl overflow-hidden bg-white">
        {/* Dotted pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <pattern id="jdots" x="8" y="8" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="#d1d5db" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jdots)" />
        </svg>

        <div className="relative" style={{ zIndex: 1 }}>
          {stages.map((stage: any, si: number) => {
            const steps = Array.isArray(stage.steps) ? stage.steps : [];
            return (
              <div key={si} className="px-6 pt-6 pb-8">
                {/* Stage header */}
                <div className="flex items-center gap-3 mb-5">
                  <h4 className="text-2xl font-extralight tracking-tight" style={{ fontFamily: "'Manrope', sans-serif", color: '#c5c9d4' }}>{stage.name}</h4>
                  {stage.milestone && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/70">
                      <span className="text-blue-500">{JI.milestone}</span>
                      <span className="text-[11px] font-medium text-blue-600">Milestone: {stage.milestone}</span>
                    </div>
                  )}
                </div>

                {/* Horizontal flow */}
                <div className="flex items-start overflow-x-auto pb-2">
                  {stage.entryCriteria && (
                    <>
                      <JNode icon={JI.entry} label={stage.entryCriteria} bg="bg-gray-100" fg="text-gray-500" />
                      {steps.length > 0 && <JDash />}
                    </>
                  )}
                  <JStepFlow steps={steps} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

export default function WorkflowStepCard({ stepType, output, stepLabel, stepNumber, skillFamily }: {
  stepType: StepType;
  output: Record<string, any>;
  stepLabel: string;
  stepNumber: number;
  skillFamily?: string;
}) {
  // Route to JourneyCard for create steps with journey skill family
  if (stepType === 'create' && skillFamily === 'journey') {
    return <JourneyCard output={output} stepLabel={stepLabel} stepNumber={stepNumber} />;
  }
  const Card = stepCardRegistry[stepType] || AnalysisCard;
  return <Card output={output} stepLabel={stepLabel} stepNumber={stepNumber} />;
}

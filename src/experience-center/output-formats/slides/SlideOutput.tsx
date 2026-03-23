/**
 * SlideOutput — renders generated deck in the right-side output panel
 * with layout-specific visual templates.
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Presentation, Expand, Target, TrendingUp, Zap, AlertTriangle, Info } from 'lucide-react';
import type { DeckData, Slide } from './types';

// ── Layout Renderers ──

function CoverSlide({ slide }: { slide: Slide }) {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
        <img src="/td-icon.svg" alt="" className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">{slide.title}</h2>
      {slide.subtitle && <p className="text-xs text-gray-400 max-w-[80%]">{slide.subtitle}</p>}
    </div>
  );
}

function HeroSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col justify-center h-full">
      <h3 className="text-sm font-bold text-gray-900 mb-1">{slide.title}</h3>
      {slide.subtitle && <p className="text-xs text-gray-500 mb-3">{slide.subtitle}</p>}
      {slide.stat && (
        <div className="bg-blue-50 rounded-xl p-3 mb-3 inline-flex items-center gap-3 self-start">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <div>
            <div className="text-lg font-bold text-blue-700">{slide.stat}</div>
            {slide.statLabel && <div className="text-[9px] text-blue-500 uppercase tracking-wider">{slide.statLabel}</div>}
          </div>
        </div>
      )}
      {slide.bullets && (
        <ul className="space-y-1.5">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SegmentsSlide({ slide }: { slide: Slide }) {
  const levelColors: Record<string, string> = { High: 'bg-emerald-400', Medium: 'bg-amber-400', Low: 'bg-gray-300' };
  const levelBg: Record<string, string> = { High: 'bg-emerald-50 text-emerald-700', Medium: 'bg-amber-50 text-amber-700', Low: 'bg-gray-100 text-gray-500' };
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{slide.title}</h3>
      <div className="space-y-2">
        {(slide.segments || []).map((seg, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-900 truncate">{seg.name}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${levelBg[seg.level] || levelBg.Low}`}>{seg.level}</span>
              </div>
              <div className="text-[10px] text-gray-500">{seg.description}</div>
            </div>
            <div className="w-12 flex-shrink-0">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${levelColors[seg.level] || 'bg-gray-300'}`} style={{ width: `${seg.score}%` }} />
              </div>
              <div className="text-[8px] text-gray-400 text-right mt-0.5">{seg.score}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneySlide({ slide }: { slide: Slide }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{slide.title}</h3>
      <div className="flex items-start gap-1">
        {(slide.stages || []).map((stage, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center text-[9px] font-bold text-blue-700 mb-1.5">{i + 1}</div>
            {i < (slide.stages?.length || 0) - 1 && <div className="w-full h-0.5 bg-blue-100 -mt-5 mb-3.5" />}
            <div className="text-center">
              <div className="text-[10px] font-semibold text-gray-900 mb-0.5">{stage.name}</div>
              <div className="text-[9px] text-gray-500 leading-tight">{stage.description}</div>
              {stage.channel && <div className="text-[8px] text-blue-600 mt-0.5">{stage.channel}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiSlide({ slide }: { slide: Slide }) {
  const colors = ['border-blue-200 bg-blue-50/50', 'border-indigo-200 bg-indigo-50/50', 'border-amber-200 bg-amber-50/50', 'border-emerald-200 bg-emerald-50/50'];
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{slide.title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {(slide.kpis || []).map((kpi, i) => (
          <div key={i} className={`rounded-lg p-2.5 border ${colors[i] || colors[0]}`}>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{kpi.name}</div>
            <div className="text-sm font-bold text-gray-900">{kpi.value}</div>
            {kpi.note && <div className="text-[9px] text-gray-500 mt-0.5">{kpi.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosisSlide({ slide }: { slide: Slide }) {
  const severityConfig: Record<string, { border: string; icon: React.ReactNode }> = {
    critical: { border: 'border-l-red-400', icon: <AlertTriangle className="w-3 h-3 text-red-500" /> },
    warning: { border: 'border-l-amber-400', icon: <AlertTriangle className="w-3 h-3 text-amber-500" /> },
    info: { border: 'border-l-blue-400', icon: <Info className="w-3 h-3 text-blue-500" /> },
  };
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{slide.title}</h3>
      <div className="space-y-2">
        {(slide.findings || []).map((f, i) => {
          const cfg = severityConfig[f.severity] || severityConfig.info;
          return (
            <div key={i} className={`border border-gray-100 border-l-4 ${cfg.border} rounded-lg p-2.5`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {cfg.icon}
                <span className="text-[10px] font-semibold text-gray-700">{f.label}</span>
              </div>
              <div className="text-[10px] text-gray-600 pl-5">{f.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelsSlide({ slide }: { slide: Slide }) {
  const barColors = ['bg-blue-400', 'bg-emerald-400', 'bg-indigo-400', 'bg-amber-400'];
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{slide.title}</h3>
      {/* Allocation bar */}
      <div className="h-2 rounded-full overflow-hidden flex mb-3">
        {(slide.channels || []).map((ch, i) => (
          <div key={i} className={`h-full ${barColors[i] || 'bg-gray-300'}`} style={{ width: `${ch.percent}%` }} />
        ))}
      </div>
      <div className="space-y-1.5">
        {(slide.channels || []).map((ch, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${barColors[i] || 'bg-gray-300'}`} />
            <span className="font-semibold text-gray-900 w-16 truncate">{ch.name}</span>
            <span className="text-gray-500 flex-1">{ch.role}</span>
            <span className="font-bold text-gray-700">{ch.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategySlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col justify-center h-full">
      <h3 className="text-sm font-bold text-gray-900 mb-1">{slide.title}</h3>
      {slide.subtitle && <p className="text-[10px] text-gray-400 mb-3">{slide.subtitle}</p>}
      {slide.highlight && (
        <div className="bg-blue-50 border-l-3 border-blue-400 rounded-r-lg px-3 py-2 mb-3">
          <p className="text-[11px] text-blue-800 font-medium">{slide.highlight}</p>
        </div>
      )}
      {slide.bullets && (
        <ul className="space-y-1.5">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionsSlide({ slide }: { slide: Slide }) {
  const priorityColors: Record<string, string> = {
    'Do now': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Test next': 'bg-blue-50 text-blue-700 border-blue-200',
    'Scale later': 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3">{slide.title}</h3>
      <div className="space-y-1.5">
        {(slide.actions || slide.bullets?.map(b => ({ action: b, priority: 'Do now' })) || []).map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-[10px]">
            <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-[8px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <span className="text-gray-700 flex-1">{a.action}</span>
            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-semibold border ${priorityColors[a.priority] || priorityColors['Scale later']}`}>{a.priority}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col justify-center h-full">
      <h3 className="text-sm font-bold text-gray-900 mb-2">{slide.title}</h3>
      {slide.stat && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 mb-3 border border-blue-100">
          <div className="text-xl font-bold text-blue-700">{slide.stat}</div>
          {slide.statLabel && <div className="text-[9px] text-blue-500 uppercase tracking-wider mt-0.5">{slide.statLabel}</div>}
        </div>
      )}
      {slide.bullets && (
        <ul className="space-y-1.5">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700">
              <TrendingUp className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Layout Router ──

function SlideContent({ slide }: { slide: Slide }) {
  switch (slide.layout) {
    case 'cover': return <CoverSlide slide={slide} />;
    case 'hero': return <HeroSlide slide={slide} />;
    case 'segments': return <SegmentsSlide slide={slide} />;
    case 'journey': return <JourneySlide slide={slide} />;
    case 'kpi': return <KpiSlide slide={slide} />;
    case 'diagnosis': return <DiagnosisSlide slide={slide} />;
    case 'channels': return <ChannelsSlide slide={slide} />;
    case 'strategy': return <StrategySlide slide={slide} />;
    case 'actions': return <ActionsSlide slide={slide} />;
    case 'impact': return <ImpactSlide slide={slide} />;
    default: return <StrategySlide slide={slide} />;
  }
}

// ── Slide Card ──

function SlideCard({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden aspect-[16/10] flex flex-col">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/td-icon.svg" alt="" className="w-4 h-4 brightness-200" />
          <span className="text-[9px] text-gray-400 font-medium">Treasure AI</span>
        </div>
        <span className="text-[9px] text-gray-500">{index + 1} / {total}</span>
      </div>
      <div className="flex-1 p-5 overflow-hidden">
        <SlideContent slide={slide} />
      </div>
      {slide.speakerNotes && (
        <div className="px-5 py-1.5 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[9px] text-gray-400 italic truncate">{slide.speakerNotes}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

export default function SlideOutput({ deck, onExpand }: { deck: DeckData; onExpand?: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const total = deck.slides.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">{deck.title}</span>
        </div>
        {onExpand && (
          <button onClick={onExpand} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all">
            <Expand className="w-3 h-3" /> Full screen
          </button>
        )}
      </div>
      <SlideCard slide={deck.slides[currentSlide]} index={currentSlide} total={total} />
      <div className="flex items-center justify-between mt-3">
        <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1.5">
          {deck.slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${i === currentSlide ? 'bg-blue-500 scale-110' : 'bg-gray-300 hover:bg-gray-400'}`} />
          ))}
        </div>
        <button onClick={() => setCurrentSlide(Math.min(total - 1, currentSlide + 1))} disabled={currentSlide === total - 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

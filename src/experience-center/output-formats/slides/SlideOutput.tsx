/**
 * SlideOutput — TD 2026 branded slide renderer.
 *
 * Brand: Deep Blue #2D40AA, Purple #847BF2, Sky Blue #8BBCFD, Peach #FDB893
 * Typography: Poppins (titles), Manrope (body)
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Presentation, Expand, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { DeckData, Slide } from './types';

// ── TD Brand Constants ──
const BRAND = {
  deepBlue: '#2D40AA',
  purple: '#847BF2',
  skyBlue: '#8BBCFD',
  peach: '#FDB893',
  orchid: '#C466D4',
  lightGray: '#F7F5F9',
};

// ── Layout Renderers ──

function CoverSlide({ slide }: { slide: Slide }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${BRAND.deepBlue} 0%, ${BRAND.purple} 100%)` }}>
      {/* Decorative elements */}
      <div className="absolute top-4 right-8 w-16 h-16 rounded-full opacity-20" style={{ background: BRAND.skyBlue }} />
      <div className="absolute bottom-8 left-6 w-10 h-10 rounded-full opacity-15" style={{ background: BRAND.peach }} />
      <img src="/td-icon.svg" alt="" className="w-8 h-8 brightness-200 mb-4 opacity-80" />
      <h2 className="text-xl font-semibold text-white mb-2 px-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className="text-xs text-white/70 px-8 max-w-[85%]" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {slide.subtitle}
        </p>
      )}
    </div>
  );
}

function HeroSlide({ slide }: { slide: Slide }) {
  return (
    <div className="h-full flex flex-col justify-center px-5 py-4">
      <h3 className="text-sm font-semibold mb-1.5" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>
        {slide.title}
      </h3>
      {slide.subtitle && (
        <p className="text-xs text-gray-600 mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {slide.subtitle}
        </p>
      )}
      {slide.stat && (
        <div className="rounded-xl p-3 mb-3 inline-flex items-center gap-3 self-start" style={{ background: `${BRAND.purple}12` }}>
          <TrendingUp className="w-5 h-5" style={{ color: BRAND.purple }} />
          <div>
            <div className="text-lg font-bold" style={{ color: BRAND.deepBlue, fontFamily: "'Poppins', sans-serif" }}>{slide.stat}</div>
            {slide.statLabel && <div className="text-[8px] uppercase tracking-wider" style={{ color: BRAND.purple }}>{slide.statLabel}</div>}
          </div>
        </div>
      )}
      {slide.bullets && (
        <ul className="space-y-1.5">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: BRAND.purple }} />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SegmentsSlide({ slide }: { slide: Slide }) {
  const levelColors: Record<string, string> = { High: BRAND.purple, Medium: BRAND.skyBlue, Low: '#D1D5DB' };
  const levelBg: Record<string, string> = { High: `${BRAND.purple}15`, Medium: `${BRAND.skyBlue}20`, Low: '#F3F4F6' };
  return (
    <div className="px-5 py-4">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      <div className="space-y-2">
        {(slide.segments || []).map((seg, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: BRAND.lightGray }}>
            <span className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: BRAND.deepBlue }}>{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>{seg.name}</span>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: levelBg[seg.level], color: levelColors[seg.level] }}>{seg.level}</span>
              </div>
              <div className="text-[10px] text-gray-500" style={{ fontFamily: "'Manrope', sans-serif" }}>{seg.description}</div>
            </div>
            <div className="w-10 flex-shrink-0">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                <div className="h-full rounded-full" style={{ width: `${seg.score}%`, background: levelColors[seg.level] }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneySlide({ slide }: { slide: Slide }) {
  return (
    <div className="px-5 py-4">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      <div className="flex items-start gap-1">
        {(slide.stages || []).map((stage, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold mb-1.5" style={{ borderColor: BRAND.purple, color: BRAND.deepBlue, background: `${BRAND.purple}10` }}>{i + 1}</div>
            <div className="text-center">
              <div className="text-[10px] font-semibold mb-0.5" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{stage.name}</div>
              <div className="text-[9px] text-gray-500 leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>{stage.description}</div>
              {stage.channel && <div className="text-[8px] mt-0.5" style={{ color: BRAND.purple }}>{stage.channel}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiSlide({ slide }: { slide: Slide }) {
  const accents = [BRAND.deepBlue, BRAND.purple, BRAND.skyBlue, BRAND.peach];
  return (
    <div className="px-5 py-4">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {(slide.kpis || []).map((kpi, i) => (
          <div key={i} className="rounded-xl p-2.5" style={{ background: `${accents[i]}10`, borderLeft: `3px solid ${accents[i]}` }}>
            <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: accents[i], fontFamily: "'Manrope', sans-serif" }}>{kpi.name}</div>
            <div className="text-sm font-bold" style={{ color: BRAND.deepBlue, fontFamily: "'Poppins', sans-serif" }}>{kpi.value}</div>
            {kpi.note && <div className="text-[9px] text-gray-500 mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>{kpi.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosisSlide({ slide }: { slide: Slide }) {
  const severityConfig: Record<string, { border: string; color: string }> = {
    critical: { border: '#EF4444', color: '#DC2626' },
    warning: { border: BRAND.peach, color: '#D97706' },
    info: { border: BRAND.skyBlue, color: BRAND.deepBlue },
  };
  return (
    <div className="px-5 py-4">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      <div className="space-y-2">
        {(slide.findings || []).map((f, i) => {
          const cfg = severityConfig[f.severity] || severityConfig.info;
          return (
            <div key={i} className="rounded-lg p-2.5" style={{ borderLeft: `3px solid ${cfg.border}`, background: BRAND.lightGray }}>
              <div className="text-[10px] font-semibold mb-0.5" style={{ color: cfg.color, fontFamily: "'Poppins', sans-serif" }}>{f.label}</div>
              <div className="text-[10px] text-gray-600" style={{ fontFamily: "'Manrope', sans-serif" }}>{f.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelsSlide({ slide }: { slide: Slide }) {
  const colors = [BRAND.deepBlue, BRAND.purple, BRAND.skyBlue, BRAND.peach];
  return (
    <div className="px-5 py-4">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      <div className="h-2 rounded-full overflow-hidden flex mb-3">
        {(slide.channels || []).map((ch, i) => (
          <div key={i} className="h-full" style={{ width: `${ch.percent}%`, background: colors[i] }} />
        ))}
      </div>
      <div className="space-y-1.5">
        {(slide.channels || []).map((ch, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i] }} />
            <span className="font-semibold text-gray-900 w-14 truncate">{ch.name}</span>
            <span className="text-gray-500 flex-1">{ch.role}</span>
            <span className="font-bold" style={{ color: BRAND.deepBlue }}>{ch.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategySlide({ slide }: { slide: Slide }) {
  return (
    <div className="h-full flex flex-col justify-center px-5 py-4">
      <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      {slide.subtitle && <p className="text-[10px] text-gray-400 mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>{slide.subtitle}</p>}
      {slide.highlight && (
        <div className="rounded-lg px-3 py-2 mb-3" style={{ borderLeft: `3px solid ${BRAND.purple}`, background: `${BRAND.purple}08` }}>
          <p className="text-[11px] font-medium" style={{ color: BRAND.deepBlue, fontFamily: "'Manrope', sans-serif" }}>{slide.highlight}</p>
        </div>
      )}
      {slide.bullets && (
        <ul className="space-y-1.5">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: BRAND.purple }} />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionsSlide({ slide }: { slide: Slide }) {
  const priorityColors: Record<string, { bg: string; text: string }> = {
    'Do now': { bg: `${BRAND.deepBlue}12`, text: BRAND.deepBlue },
    'Test next': { bg: `${BRAND.purple}12`, text: BRAND.purple },
    'Scale later': { bg: '#F3F4F6', text: '#6B7280' },
  };
  return (
    <div className="px-5 py-4">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      <div className="space-y-1.5">
        {(slide.actions || []).map((a, i) => {
          const pc = priorityColors[a.priority] || priorityColors['Scale later'];
          return (
            <div key={i} className="flex items-start gap-2 text-[10px]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <span className="w-4 h-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: BRAND.deepBlue }}>{i + 1}</span>
              <span className="text-gray-700 flex-1">{a.action}</span>
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[8px] font-semibold" style={{ background: pc.bg, color: pc.text }}>{a.priority}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImpactSlide({ slide }: { slide: Slide }) {
  return (
    <div className="h-full flex flex-col justify-center px-5 py-4">
      <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: "'Poppins', sans-serif", color: BRAND.deepBlue }}>{slide.title}</h3>
      {slide.stat && (
        <div className="rounded-xl p-3 mb-3" style={{ background: `linear-gradient(135deg, ${BRAND.deepBlue}10, ${BRAND.purple}15)` }}>
          <div className="text-xl font-bold" style={{ color: BRAND.deepBlue, fontFamily: "'Poppins', sans-serif" }}>{slide.stat}</div>
          {slide.statLabel && <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: BRAND.purple }}>{slide.statLabel}</div>}
        </div>
      )}
      {slide.bullets && (
        <ul className="space-y-1.5">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-gray-700" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.purple }} />
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
  const isGradientSlide = slide.layout === 'cover';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden aspect-[16/10] flex flex-col">
      {!isGradientSlide && (
        <div className="px-5 py-1.5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src="/td-icon.svg" alt="" className="w-3.5 h-3.5" />
            <span className="text-[8px] font-medium" style={{ color: BRAND.deepBlue, fontFamily: "'Manrope', sans-serif" }}>Treasure AI</span>
          </div>
          <span className="text-[8px] text-gray-400">{index + 1} / {total}</span>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <SlideContent slide={slide} />
      </div>
      {slide.speakerNotes && (
        <div className="px-5 py-1 border-t border-gray-100" style={{ background: BRAND.lightGray }}>
          <p className="text-[8px] text-gray-400 italic truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>{slide.speakerNotes}</p>
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
          <Presentation className="w-4 h-4" style={{ color: BRAND.deepBlue }} />
          <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{deck.title}</span>
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
            <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${i === currentSlide ? 'scale-110' : ''}`} style={{ background: i === currentSlide ? BRAND.deepBlue : '#D1D5DB' }} />
          ))}
        </div>
        <button onClick={() => setCurrentSlide(Math.min(total - 1, currentSlide + 1))} disabled={currentSlide === total - 1} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

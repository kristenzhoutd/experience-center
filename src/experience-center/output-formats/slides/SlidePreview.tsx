/**
 * SlidePreview — full-screen slide viewer reusing SlideOutput's layout templates.
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Presentation } from 'lucide-react';
import type { DeckData } from './types';
// Re-export the inline SlideCard by importing the module — we render slides identically
// but in a larger viewport. For now, duplicate the card to avoid circular deps.
import SlideOutput from './SlideOutput';

export default function SlidePreview({ deck, onClose }: { deck: DeckData; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const total = deck.slides.length;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[9998]" />
      <div className="fixed inset-4 md:inset-8 bg-gray-100 rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <Presentation className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">{deck.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{currentSlide + 1} of {total}</span>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide area */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="absolute left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-full max-w-3xl">
            {/* Render the slide using SlideOutput's internal card — we embed it here for the full-screen view */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden aspect-[16/10] flex flex-col">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/td-icon.svg" alt="" className="w-5 h-5 brightness-200" />
                  <span className="text-[10px] text-gray-400 font-medium">Treasure AI</span>
                </div>
                <span className="text-[10px] text-gray-500">{currentSlide + 1} / {total}</span>
              </div>
              <div className="flex-1 p-8 overflow-hidden">
                {/* Inline layout rendering matching SlideOutput */}
                <SlideContentPreview slide={deck.slides[currentSlide]} />
              </div>
              {deck.slides[currentSlide].speakerNotes && (
                <div className="px-8 py-2 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] text-gray-400 italic">{deck.slides[currentSlide].speakerNotes}</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentSlide(Math.min(total - 1, currentSlide + 1))}
            disabled={currentSlide === total - 1}
            className="absolute right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex gap-2 justify-center">
            {deck.slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-20 h-12 rounded-lg border-2 flex items-center justify-center text-[9px] text-gray-500 cursor-pointer transition-all ${
                  i === currentSlide ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="truncate px-1">{slide.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// Simplified content renderer for preview (larger text sizes)
import { TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { Slide } from './types';

function SlideContentPreview({ slide }: { slide: Slide }) {
  switch (slide.layout) {
    case 'cover':
      return (
        <div className="text-center flex flex-col items-center justify-center h-full">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
            <img src="/td-icon.svg" alt="" className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{slide.title}</h2>
          {slide.subtitle && <p className="text-sm text-gray-400">{slide.subtitle}</p>}
        </div>
      );
    case 'hero':
      return (
        <div className="flex flex-col justify-center h-full">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{slide.title}</h3>
          {slide.subtitle && <p className="text-sm text-gray-500 mb-4">{slide.subtitle}</p>}
          {slide.stat && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4 inline-flex items-center gap-3 self-start">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{slide.stat}</div>
                {slide.statLabel && <div className="text-[10px] text-blue-500 uppercase tracking-wider">{slide.statLabel}</div>}
              </div>
            </div>
          )}
          {slide.bullets && (
            <ul className="space-y-2">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />{b}</li>
              ))}
            </ul>
          )}
        </div>
      );
    case 'kpi':
      return (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{slide.title}</h3>
          <div className="grid grid-cols-2 gap-3">
            {(slide.kpis || []).map((kpi, i) => (
              <div key={i} className="rounded-xl p-3 border border-gray-100 bg-gray-50">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">{kpi.name}</div>
                <div className="text-lg font-bold text-gray-900 mt-1">{kpi.value}</div>
                {kpi.note && <div className="text-[10px] text-gray-500 mt-0.5">{kpi.note}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    case 'actions':
      return (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{slide.title}</h3>
          <div className="space-y-2">
            {(slide.actions || []).map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-gray-700 flex-1">{a.action}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.priority === 'Do now' ? 'bg-emerald-50 text-emerald-700' : a.priority === 'Test next' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{a.priority}</span>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      // Fallback for strategy, segments, journey, diagnosis, channels, impact
      return (
        <div className="flex flex-col justify-center h-full">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{slide.title}</h3>
          {slide.subtitle && <p className="text-sm text-gray-400 mb-4">{slide.subtitle}</p>}
          {slide.bullets && (
            <ul className="space-y-2">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />{b}</li>
              ))}
            </ul>
          )}
        </div>
      );
  }
}

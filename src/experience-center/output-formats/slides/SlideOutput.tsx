/**
 * SlideOutput — renders generated deck in the right-side output panel.
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Presentation, Expand } from 'lucide-react';
import type { DeckData, Slide } from './types';

function SlideCardInline({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden aspect-[16/10] flex flex-col">
      {/* Slide header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/td-icon.svg" alt="" className="w-4 h-4 brightness-200" />
          <span className="text-[9px] text-gray-400 font-medium">Treasure AI</span>
        </div>
        <span className="text-[9px] text-gray-500">{index + 1} / {total}</span>
      </div>

      {/* Slide content */}
      <div className="flex-1 p-5 flex flex-col justify-center overflow-y-auto">
        {slide.layout === 'title' ? (
          <div className="text-center">
            <h2 className="text-base font-bold text-gray-900 mb-1.5">{slide.title}</h2>
            {slide.subtitle && <p className="text-xs text-gray-500">{slide.subtitle}</p>}
          </div>
        ) : slide.layout === 'kpi' ? (
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-2.5">{slide.title}</h3>
            {slide.kpis && (
              <div className="grid grid-cols-2 gap-2">
                {slide.kpis.map((kpi, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">{kpi.name}</div>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">{kpi.value}</div>
                    {kpi.note && <div className="text-[9px] text-gray-400 mt-0.5">{kpi.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : slide.layout === 'actions' ? (
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-2.5">{slide.title}</h3>
            <div className="space-y-1">
              {(slide.actions || []).map((action, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className={`flex-shrink-0 px-1 py-0.5 rounded text-[8px] font-semibold ${
                    action.priority === 'Do now' ? 'bg-green-50 text-green-700' :
                    action.priority === 'Test next' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{action.priority}</span>
                  <span className="text-gray-700">{action.action}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-2.5">{slide.title}</h3>
            {slide.subtitle && <p className="text-[10px] text-gray-400 mb-2">{slide.subtitle}</p>}
            {slide.bullets && (
              <ul className="space-y-1">
                {slide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Speaker notes */}
      {slide.speakerNotes && (
        <div className="px-4 py-1.5 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[9px] text-gray-400 italic truncate">{slide.speakerNotes}</p>
        </div>
      )}
    </div>
  );
}

export default function SlideOutput({ deck, onExpand }: { deck: DeckData; onExpand?: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const total = deck.slides.length;

  return (
    <div>
      {/* Deck header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">{deck.title}</span>
        </div>
        {onExpand && (
          <button
            onClick={onExpand}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 cursor-pointer transition-all"
          >
            <Expand className="w-3 h-3" />
            Full screen
          </button>
        )}
      </div>

      {/* Current slide */}
      <SlideCardInline slide={deck.slides[currentSlide]} index={currentSlide} total={total} />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {deck.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                i === currentSlide ? 'bg-blue-500 scale-110' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlide(Math.min(total - 1, currentSlide + 1))}
          disabled={currentSlide === total - 1}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

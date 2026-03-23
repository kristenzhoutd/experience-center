/**
 * Slide preview — renders generated deck in a visual preview format.
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Presentation, Target, ArrowRight, BarChart3 } from 'lucide-react';
import type { DeckData, Slide } from './types';

interface SlidePreviewProps {
  deck: DeckData;
  onClose: () => void;
}

function SlideCard({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden aspect-[16/10] flex flex-col">
      {/* Slide header bar */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/td-icon.svg" alt="" className="w-5 h-5 brightness-200" />
          <span className="text-[10px] text-gray-400 font-medium">Treasure AI</span>
        </div>
        <span className="text-[10px] text-gray-500">{index + 1} / {total}</span>
      </div>

      {/* Slide content */}
      <div className="flex-1 p-6 flex flex-col justify-center">
        {slide.layout === 'title' ? (
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{slide.title}</h2>
            {slide.subtitle && <p className="text-sm text-gray-500">{slide.subtitle}</p>}
          </div>
        ) : slide.layout === 'kpi' ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{slide.title}</h3>
            {slide.kpis && (
              <div className="grid grid-cols-2 gap-2">
                {slide.kpis.map((kpi, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{kpi.name}</div>
                    <div className="text-sm font-bold text-gray-900 mt-0.5">{kpi.value}</div>
                    {kpi.note && <div className="text-[10px] text-gray-400 mt-0.5">{kpi.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : slide.layout === 'actions' ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{slide.title}</h3>
            {slide.actions ? (
              <div className="space-y-1.5">
                {slide.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                      action.priority === 'Do now' ? 'bg-green-50 text-green-700' :
                      action.priority === 'Test next' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{action.priority}</span>
                    <span className="text-gray-700">{action.action}</span>
                  </div>
                ))}
              </div>
            ) : slide.bullets && (
              <ul className="space-y-1.5">
                {slide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : slide.layout === 'two-column' ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{slide.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              <ul className="space-y-1.5">
                {slide.columns?.left.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <ul className="space-y-1.5">
                {slide.columns?.right.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{slide.title}</h3>
            {slide.subtitle && <p className="text-[11px] text-gray-400 mb-3">{slide.subtitle}</p>}
            {slide.bullets && (
              <ul className="space-y-1.5">
                {slide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
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
        <div className="px-6 py-2 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[10px] text-gray-400 italic">{slide.speakerNotes}</p>
        </div>
      )}
    </div>
  );
}

export default function SlidePreview({ deck, onClose }: SlidePreviewProps) {
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
            {deck.subtitle && <span className="text-xs text-gray-400">— {deck.subtitle}</span>}
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
          {/* Navigation */}
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="absolute left-4 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-full max-w-2xl">
            <SlideCard slide={deck.slides[currentSlide]} index={currentSlide} total={total} />
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
                  i === currentSlide
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
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

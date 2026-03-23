/**
 * Slide creation modal — configures and triggers deck generation.
 */

import { useState } from 'react';
import { Presentation, X } from 'lucide-react';
import type { DeckConfig, DeckLength, DeckStyle } from './types';

interface SlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: DeckConfig) => void;
  defaultTitle?: string;
  isGenerating?: boolean;
}

const LENGTH_OPTIONS: { value: DeckLength; label: string; description: string }[] = [
  { value: 3, label: '3 slides', description: 'Quick summary' },
  { value: 5, label: '5 slides', description: 'Standard deck' },
  { value: 7, label: '7 slides', description: 'Detailed review' },
];

const STYLE_OPTIONS: { value: DeckStyle; label: string; description: string }[] = [
  { value: 'executive', label: 'Executive summary', description: 'Concise, impact-led, decision-ready' },
  { value: 'strategy', label: 'Strategy review', description: 'Analytical, evidence-backed, narrative' },
  { value: 'working', label: 'Team working session', description: 'Practical, discussion-oriented, actionable' },
];

export default function SlideModal({ isOpen, onClose, onGenerate, defaultTitle, isGenerating }: SlideModalProps) {
  const [length, setLength] = useState<DeckLength>(5);
  const [style, setStyle] = useState<DeckStyle>('executive');
  const [customTitle, setCustomTitle] = useState(defaultTitle || '');

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/30 z-[9998]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[90vw] bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Presentation className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Create slides</h3>
              <p className="text-[11px] text-gray-400">Turn this recommendation into a presentation-ready deck</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Deck title */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Deck title</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Optional — auto-generated if empty"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Deck length */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">Deck length</label>
            <div className="grid grid-cols-3 gap-2">
              {LENGTH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLength(opt.value)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    length === opt.value
                      ? 'border-blue-400 bg-blue-50/60 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Deck style */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">Deck style</label>
            <div className="space-y-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStyle(opt.value)}
                  className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    style === opt.value
                      ? 'border-blue-400 bg-blue-50/60 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate({ length, style, customTitle: customTitle.trim() || undefined })}
            disabled={isGenerating}
            className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Create slides'}
          </button>
        </div>
      </div>
    </>
  );
}

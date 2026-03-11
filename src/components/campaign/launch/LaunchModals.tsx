/**
 * Shared modals for campaign launch — AI prompt modal, image lightbox, save toast.
 */

import { AlertTriangle, Check, ChevronDown, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import LaunchProgressModal from './LaunchProgressModal';
import DAMAssetBrowser from './DAMAssetBrowser';
import type { CampaignLaunchPageState } from '../../../hooks/useCampaignLaunchPageState';

interface Props {
  state: CampaignLaunchPageState;
}

export default function LaunchModals({ state }: Props) {
  const {
    showProgress,
    progress,
    handleProgressClose,
    setShowProgress,
    aiPromptModal,
    setAiPromptModal,
    aiGenerating,
    aiGenError,
    setAiGenError,
    imageLightbox,
    setImageLightbox,
    showSaveToast,
    handleAIGenerate,
  } = state;

  return (
    <>
      {/* Progress Modal */}
      {showProgress && (
        <LaunchProgressModal
          progress={progress}
          onClose={handleProgressClose}
          onRetry={() => {
            setShowProgress(false);
          }}
        />
      )}

      {/* AI Prompt Modal */}
      {aiPromptModal && (() => {
        const isGen = aiGenerating[aiPromptModal.creativeLocalId];
        const fieldLabel = "text-sm font-medium text-gray-700 pt-2";
        const required = <span className="text-red-500 ml-0.5">*</span>;
        const modalSelectClass = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60 cursor-pointer appearance-none";
        const updateField = (field: string, value: string | boolean) =>
          setAiPromptModal((prev) => prev ? { ...prev, [field]: value } : null);
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-[fadeIn_0.15s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 m-0">AI Image Generation</h3>
              <button
                onClick={() => setAiPromptModal(null)}
                disabled={isGen}
                className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
              {/* Content */}
              <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Content{required}</label>
                <div>
                  <textarea
                    id="ai-prompt-content"
                    value={aiPromptModal.content}
                    onChange={(e) => updateField('content', e.target.value)}
                    disabled={isGen}
                    rows={4}
                    placeholder="Please describe the image you want to create as specifically as possible."
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
                  />
                  <p className="text-xs text-gray-400 mt-1 m-0">Do not infringe on copyrighted material.</p>
                </div>
              </div>

              {/* Style */}
              <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Style{required}</label>
                <select
                  value={aiPromptModal.style}
                  onChange={(e) => updateField('style', e.target.value)}
                  disabled={isGen}
                  className={modalSelectClass}
                >
                  <option value="">Select One</option>
                  <option value="photorealistic">Photorealistic</option>
                  <option value="illustration">Illustration</option>
                  <option value="3d-render">3D Render</option>
                  <option value="flat-design">Flat Design</option>
                  <option value="watercolor">Watercolor</option>
                  <option value="minimalist">Minimalist</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Aspect Ratio{required}</label>
                <select
                  value={aiPromptModal.aspectRatio}
                  onChange={(e) => updateField('aspectRatio', e.target.value)}
                  disabled={isGen}
                  className={modalSelectClass}
                >
                  <option value="">Select One</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:5">4:5 (Portrait)</option>
                  <option value="9:16">9:16 (Story)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="1.91:1">1.91:1 (Feed Landscape)</option>
                </select>
              </div>

              {/* Purpose */}
              <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Purpose</label>
                <textarea
                  value={aiPromptModal.purpose}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  disabled={isGen}
                  rows={2}
                  placeholder="Media where images will be used, and purpose of images"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
                />
              </div>

              {/* Brand Guidelines */}
              <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Brand Guidelines</label>
                <textarea
                  value={aiPromptModal.brandGuidelines || ''}
                  onChange={(e) => updateField('brandGuidelines', e.target.value)}
                  disabled={isGen}
                  rows={3}
                  placeholder="e.g. Use warm tones, no text overlays, include outdoor/nature settings, Hilton blue (#003B5C), premium and aspirational feel"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
                />
              </div>

              {/* Advanced Settings */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => updateField('advancedOpen', !aiPromptModal.advancedOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 bg-transparent border-none cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Advanced Settings
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${aiPromptModal.advancedOpen ? 'rotate-180' : ''}`} />
                </button>
                {aiPromptModal.advancedOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                      <label className={fieldLabel}>Negative Prompt</label>
                      <textarea
                        value={aiPromptModal.negativePrompt}
                        onChange={(e) => updateField('negativePrompt', e.target.value)}
                        disabled={isGen}
                        rows={2}
                        placeholder="Describe elements to avoid in the image"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-vertical focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                      <label className={`${fieldLabel} flex items-center gap-1`}>
                        Image Size (pixels)
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                      </label>
                      <input
                        type="text"
                        value={aiPromptModal.imageSize}
                        onChange={(e) => updateField('imageSize', e.target.value)}
                        disabled={isGen}
                        placeholder="Example: 1024 × 1024"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-x-4 items-start">
                      <label className={`${fieldLabel} flex items-center gap-1`}>
                        Quality
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                      </label>
                      <select
                        value={aiPromptModal.quality}
                        onChange={(e) => updateField('quality', e.target.value)}
                        disabled={isGen}
                        className={modalSelectClass}
                      >
                        <option value="">Select One</option>
                        <option value="standard">Standard</option>
                        <option value="high">High</option>
                        <option value="ultra">Ultra</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Generated preview */}
              {aiPromptModal.generatedPreview && (
                <div className="border border-green-200 bg-green-50/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Image generated successfully</span>
                  </div>
                  <button
                    onClick={() => setImageLightbox({ src: aiPromptModal.generatedPreview!.previewUrl, alt: aiPromptModal.generatedPreview!.fileName })}
                    className="relative group bg-transparent border-none p-0 cursor-pointer block mx-auto"
                  >
                    <img
                      src={aiPromptModal.generatedPreview.previewUrl}
                      alt={aiPromptModal.generatedPreview.fileName}
                      className="max-h-64 max-w-full rounded-lg border border-gray-200 shadow-sm group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded-full p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2 m-0">
                    {aiPromptModal.generatedPreview.fileName} — {(aiPromptModal.generatedPreview.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              {/* Inline error */}
              {aiGenError[aiPromptModal.creativeLocalId] && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-700 flex-1 whitespace-pre-line">{aiGenError[aiPromptModal.creativeLocalId]}</span>
                  </div>
                  <button
                    onClick={() => {
                      const lines = aiPromptModal.content.split('\n');
                      const brandNames: string[] = [];
                      for (const line of lines) {
                        const brandMatch = line.match(/^(?:Brand\/Product|Campaign|Company):\s*(.+)/i);
                        if (brandMatch) {
                          const val = brandMatch[1].trim();
                          brandNames.push(val);
                          val.split(/[\s\u2014\u2013\-,]+/).forEach((word) => {
                            const clean = word.replace(/[\u2122\u00AE\u00A9]/g, '');
                            if (clean.length >= 3 && /^[A-Z]/.test(clean)) brandNames.push(clean);
                          });
                        }
                      }
                      const uniqueBrands = [...new Set(brandNames)].filter(Boolean);
                      const brandRegex = uniqueBrands.length > 0
                        ? new RegExp(`\\b(${uniqueBrands.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi')
                        : null;
                      const refined = lines
                        .filter((line) => !/^(Brand\/Product|Campaign|Company):/i.test(line.trim()))
                        .map((line) => {
                          let l = line.replace(/[\u2122\u00AE\u00A9]/g, '');
                          if (brandRegex) l = l.replace(brandRegex, '').replace(/\s{2,}/g, ' ').trim();
                          return l;
                        })
                        .filter((l) => l.length > 0)
                        .join('\n')
                        .trim();
                      updateField('content', refined || aiPromptModal.content);
                      setAiGenError((prev) => { const next = { ...prev }; delete next[aiPromptModal.creativeLocalId]; return next; });
                      requestAnimationFrame(() => {
                        const ta = document.getElementById('ai-prompt-content');
                        if (ta) { ta.focus(); ta.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                      });
                    }}
                    className="mt-2.5 ml-6 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Refine Prompt
                  </button>
                </div>
              )}
              {/* Generating status */}
              {isGen && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating image with AI agent...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              {aiPromptModal.generatedPreview ? (
                <>
                  <button
                    onClick={async () => {
                      updateField('generatedPreview', null as any);
                      const m = aiPromptModal;
                      const parts = [
                        m.content,
                        m.style && `Style: ${m.style}`,
                        m.aspectRatio && `Aspect ratio: ${m.aspectRatio}`,
                        m.purpose && `Purpose: ${m.purpose}`,
                        m.brandGuidelines && `Brand guidelines: ${m.brandGuidelines}`,
                        m.negativePrompt && `Negative prompt (avoid): ${m.negativePrompt}`,
                        m.imageSize && `Image size: ${m.imageSize}`,
                        m.quality && `Quality: ${m.quality}`,
                      ].filter(Boolean).join('\n');
                      await handleAIGenerate(m.creativeLocalId, parts);
                    }}
                    disabled={isGen}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => setAiPromptModal(null)}
                    className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Use Image
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAiPromptModal(null)}
                    disabled={isGen}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const m = aiPromptModal;
                      const parts = [
                        m.content,
                        m.style && `Style: ${m.style}`,
                        m.aspectRatio && `Aspect ratio: ${m.aspectRatio}`,
                        m.purpose && `Purpose: ${m.purpose}`,
                        m.brandGuidelines && `Brand guidelines: ${m.brandGuidelines}`,
                        m.negativePrompt && `Negative prompt (avoid): ${m.negativePrompt}`,
                        m.imageSize && `Image size: ${m.imageSize}`,
                        m.quality && `Quality: ${m.quality}`,
                      ].filter(Boolean).join('\n');
                      await handleAIGenerate(m.creativeLocalId, parts);
                    }}
                    disabled={isGen || !aiPromptModal.content.trim() || !aiPromptModal.style || !aiPromptModal.aspectRatio}
                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isGen ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Image Lightbox */}
      {imageLightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 cursor-pointer"
          onClick={() => setImageLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setImageLightbox(null); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-transparent border-none cursor-pointer p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={imageLightbox.src}
            alt={imageLightbox.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl cursor-default"
          />
        </div>
      )}

      {/* Save Toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
          <Check className="w-4 h-4 text-green-400" />
          Configuration saved
        </div>
      )}

      {/* DAM Asset Browser */}
      <DAMAssetBrowser />
    </>
  );
}

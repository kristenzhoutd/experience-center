/**
 * Creatives section — images, headlines, body text, CTA, links, Facebook page selection.
 */

import { Sparkles, Loader2, RefreshCw, Database } from 'lucide-react';
import { useBriefEditorStore } from '../../../../stores/briefEditorStore';
import { useDamStore } from '../../../../stores/damStore';
import type { CampaignLaunchPageState } from '../../../../hooks/useCampaignLaunchPageState';
import {
  CTA_TYPES,
  inputClass,
  selectClass,
  selectStyle,
  labelClass,
} from '../../../../pages/campaignLaunch/constants';

interface Props {
  state: CampaignLaunchPageState;
}

export default function CreativesSection({ state }: Props) {
  const {
    config,
    updateCreative,
    addCreative,
    removeCreative,
    removeFile,
    imageGenStatus,
    aiGenerating,
    aiGenError,
    setAiGenError,
    setImageLightbox,
    setAiPromptModal,
    imagePickerMode,
    setImagePickerMode,
    stockQuery,
    setStockQuery,
    stockResults,
    stockLoading,
    urlInput,
    setUrlInput,
    handleSelectFile,
    handleImageUrl,
    handleStockSearch,
    handleStockSelect,
    handleAIGenerate,
  } = state;

  return (
    <section id="section-creatives" className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 m-0 uppercase tracking-wide">
          Creatives ({config.creatives.length})
        </h2>
        <button
          onClick={addCreative}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1957DB] bg-[#EFF6FF] rounded-lg hover:bg-[#DBEAFE] transition-colors border-none cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Creative
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {config.creatives.map((creative) => (
          <div key={creative.localId} className="bg-white rounded-xl shadow-sm px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase">{creative.name}</span>
              {config.creatives.length > 1 && (
                <button
                  onClick={() => removeCreative(creative.localId)}
                  className="text-gray-300 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Image area */}
              <div className="col-span-2">
                <label className={labelClass}>Creative Image</label>
                {creative.file ? (
                  <div className="flex items-center gap-4 p-3 bg-[#F7F8FB] border border-[#E8ECF3] rounded-lg">
                    {creative.file.previewUrl ? (
                      <button
                        onClick={() => setImageLightbox({ src: creative.file!.previewUrl, alt: creative.file!.fileName })}
                        className="relative group flex-shrink-0 bg-transparent border-none p-0 cursor-pointer"
                      >
                        <img
                          src={creative.file.previewUrl}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition-opacity"
                        />
                        {creative.file.damProvider && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-black/60 text-white">
                            {creative.file.damProvider}
                          </span>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{creative.file.fileName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {(creative.file.fileSize / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!creative.file.damProvider && (
                        <button
                          onClick={() => handleAIGenerate(creative.localId)}
                          disabled={aiGenerating[creative.localId]}
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Regenerate image with AI"
                        >
                          {aiGenerating[creative.localId] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          {aiGenerating[creative.localId] ? 'Generating...' : 'Regenerate'}
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(creative.localId)}
                        className="text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : imageGenStatus[creative.localId] === 'generating' ? (
                  <div className="flex items-center justify-center gap-3 py-6 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50/30">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    <span className="text-sm text-indigo-600 font-medium">Generating image with AI...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Source buttons row */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const c = config.creatives.find((cr) => cr.localId === creative.localId);
                          const briefData = useBriefEditorStore.getState().state.briefData;
                          const contentParts = [
                            c?.headline && `Headline: ${c.headline}`,
                            c?.bodyText && `Description: ${c.bodyText}`,
                            c?.ctaType && `Call to action: ${c.ctaType}`,
                            config.campaign.name && `Campaign: ${config.campaign.name}`,
                            config.campaign.objective && `Objective: ${config.campaign.objective}`,
                            briefData?.brandProduct && `Brand/Product: ${briefData.brandProduct}`,
                            briefData?.businessObjective && `Business objective: ${briefData.businessObjective}`,
                          ].filter(Boolean);
                          setAiPromptModal({
                            creativeLocalId: creative.localId,
                            content: contentParts.length > 0
                              ? `Professional advertising image for:\n${contentParts.join('\n')}`
                              : '',
                            style: 'photorealistic',
                            aspectRatio: '1:1',
                            purpose: '',
                            brandGuidelines: '',
                            negativePrompt: '',
                            imageSize: '',
                            quality: '',
                            advancedOpen: false,
                            generatedPreview: null,
                          });
                        }}
                        disabled={aiGenerating[creative.localId]}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-2 border-dashed rounded-lg transition-all cursor-pointer bg-transparent ${
                          aiGenerating[creative.localId]
                            ? 'border-indigo-300 text-indigo-500 bg-indigo-50/30'
                            : 'border-gray-200 text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30'
                        }`}
                      >
                        {aiGenerating[creative.localId] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="text-[11px] font-medium">
                          {aiGenerating[creative.localId] ? 'Generating...' : 'AI Generate'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleSelectFile(creative.localId)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer bg-transparent"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-[11px] font-medium">Upload</span>
                      </button>
                      <button
                        onClick={() => setImagePickerMode(imagePickerMode?.creativeId === creative.localId && imagePickerMode.mode === 'url' ? null : { creativeId: creative.localId, mode: 'url' })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-2 border-dashed rounded-lg transition-all cursor-pointer bg-transparent ${
                          imagePickerMode?.creativeId === creative.localId && imagePickerMode.mode === 'url'
                            ? 'border-purple-300 text-purple-500 bg-purple-50/30'
                            : 'border-gray-200 text-gray-400 hover:text-purple-500 hover:border-purple-300 hover:bg-purple-50/30'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-[11px] font-medium">From URL</span>
                      </button>
                      <button
                        onClick={() => useDamStore.getState().open(creative.localId)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-amber-500 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer bg-transparent"
                      >
                        <Database className="w-4 h-4" />
                        <span className="text-[11px] font-medium">Browse DAM</span>
                      </button>
                    </div>

                    {/* AI generation error */}
                    {aiGenError[creative.localId] && (
                      <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-red-700 flex-1 whitespace-pre-line">{aiGenError[creative.localId]}</span>
                        <button
                          onClick={() => setAiGenError((prev) => { const next = { ...prev }; delete next[creative.localId]; return next; })}
                          className="text-red-300 hover:text-red-500 bg-transparent border-none cursor-pointer p-0 flex-shrink-0"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* URL input inline panel */}
                    {imagePickerMode?.creativeId === creative.localId && imagePickerMode.mode === 'url' && (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleImageUrl(creative.localId, urlInput);
                              setUrlInput('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => { handleImageUrl(creative.localId, urlInput); setUrlInput(''); }}
                          disabled={!urlInput.trim()}
                          className="px-3 py-2 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:bg-gray-200 disabled:text-gray-400 rounded-lg transition-colors border-none cursor-pointer disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={creative.name}
                  onChange={(e) => updateCreative(creative.localId, { name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Headline</label>
                <input
                  type="text"
                  value={creative.headline}
                  onChange={(e) => updateCreative(creative.localId, { headline: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>CTA Type</label>
                <select
                  value={creative.ctaType}
                  onChange={(e) => updateCreative(creative.localId, { ctaType: e.target.value })}
                  className={selectClass}
                  style={selectStyle}
                >
                  {CTA_TYPES.map((cta) => (
                    <option key={cta} value={cta}>{cta.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Body Text</label>
                <textarea
                  value={creative.bodyText}
                  onChange={(e) => updateCreative(creative.localId, { bodyText: e.target.value })}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className={labelClass}>Link URL</label>
                <input
                  type="url"
                  value={creative.linkUrl}
                  onChange={(e) => updateCreative(creative.localId, { linkUrl: e.target.value })}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Facebook Page</label>
                <select
                  value={creative.pageId}
                  onChange={(e) => updateCreative(creative.localId, { pageId: e.target.value })}
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="">Select a page...</option>
                  {config.facebookPages.map((page) => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


/**
 * AssetPickerModal — custom image picker for the GrapesJS editor.
 *
 * Four tabs:
 *  1. Library — browse images from the asset library
 *  2. URL — paste a URL to a web-hosted image
 *  3. Digital Assets — browse AEM/Bynder DAM assets (mock data)
 *  4. AI Generate — generate images with AI directly from the picker
 */

import { useState, useMemo, useCallback } from 'react';
import DAMBrowserInline from './DAMBrowserInline';

// ── Asset library data ──────────────────────────────────────────────

export interface LibraryAsset {
  id: string;
  name: string;
  url: string;
  category: string;
}

const UPLOADED_ASSETS_KEY = 'personalization-studio:uploaded-assets';

/** Load user-uploaded assets from localStorage (same store as AssetsPage). */
export function loadAssetLibrary(): LibraryAsset[] {
  try {
    const raw = localStorage.getItem(UPLOADED_ASSETS_KEY);
    if (!raw) return [];
    const assets: Array<{ id: string; name: string; url: string; category: string }> = JSON.parse(raw);
    return assets
      .filter((a) => a.url) // skip assets without a URL
      .map((a) => ({ id: a.id, name: a.name, url: a.url, category: a.category || 'Images' }));
  } catch {
    return [];
  }
}

// ── Main Component ────────────────────────────────────────────────────

type Tab = 'library' | 'url' | 'dam' | 'ai';

interface AssetPickerModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function AssetPickerModal({ onSelect, onClose }: AssetPickerModalProps) {
  const [tab, setTab] = useState<Tab>('library');
  const [category, setCategory] = useState('All');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  // AI Image Generation state
  const [aiGenForm, setAiGenForm] = useState({
    content: '',
    style: '',
    aspectRatio: '',
    purpose: '',
    negativePrompt: '',
    imageSize: '',
    quality: '',
    advancedOpen: false,
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);
  const [aiGenPreview, setAiGenPreview] = useState<{ previewUrl: string; fileName: string; fileSize: number } | null>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  // Load user-uploaded assets from localStorage
  const assets = useMemo(() => loadAssetLibrary(), []);
  const categories = useMemo(() => {
    const cats = new Set(assets.map((a) => a.category));
    return ['All', ...Array.from(cats).sort()];
  }, [assets]);

  const filteredAssets = category === 'All'
    ? assets
    : assets.filter((a) => a.category === category);

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Please enter a URL');
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setUrlError('Please enter a valid URL');
      return;
    }
    onSelect(trimmed);
  };

  const updateAiField = (field: string, value: string | boolean) =>
    setAiGenForm((prev) => ({ ...prev, [field]: value }));

  const handleAiGenerate = useCallback(async () => {
    const { content, style, aspectRatio, purpose, negativePrompt, imageSize, quality } = aiGenForm;
    if (!content.trim() || !style || !aspectRatio) return;

    setAiGenerating(true);
    setAiGenError(null);
    setAiGenPreview(null);

    const prompt = [
      content,
      style && `Style: ${style}`,
      aspectRatio && `Aspect ratio: ${aspectRatio}`,
      purpose && `Purpose: ${purpose}`,
      negativePrompt && `Negative prompt (avoid): ${negativePrompt}`,
      imageSize && `Image size: ${imageSize}`,
      quality && `Quality: ${quality}`,
    ].filter(Boolean).join('\n');

    try {
      const result = await window.aiSuites.launch.generateImage(prompt);
      if (result.success && result.file) {
        setAiGenPreview({
          previewUrl: result.file.previewUrl,
          fileName: result.file.fileName,
          fileSize: result.file.fileSize,
        });
      } else {
        setAiGenError(result.error || 'Image generation failed');
      }
    } catch (err) {
      setAiGenError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setAiGenerating(false);
    }
  }, [aiGenForm]);

  const handleUseAiImage = useCallback(() => {
    if (!aiGenPreview) return;

    // Optionally save to asset library
    if (saveToLibrary) {
      try {
        const raw = localStorage.getItem(UPLOADED_ASSETS_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        existing.push({
          id: `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: aiGenPreview.fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          url: aiGenPreview.previewUrl,
          type: 'image',
          category: 'Images',
        });
        localStorage.setItem(UPLOADED_ASSETS_KEY, JSON.stringify(existing));
      } catch {
        // Best-effort save; don't block insertion
      }
    }

    onSelect(aiGenPreview.previewUrl);
  }, [aiGenPreview, saveToLibrary, onSelect]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-200 ${tab === 'dam' ? 'w-[900px] max-h-[85vh]' : tab === 'ai' ? 'w-[640px] max-h-[80vh]' : 'w-[640px] max-h-[520px]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Select Image</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3">
          <button
            onClick={() => setTab('library')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === 'library'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Asset Library
          </button>
          <button
            onClick={() => setTab('url')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === 'url'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Image URL
          </button>
          <button
            onClick={() => setTab('dam')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === 'dam'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Digital Assets
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === 'ai'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            AI Generate
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 min-h-0 ${tab === 'dam' ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}>
          {tab === 'library' ? (
            <div className="p-5">
              {assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600 mb-1">No images in your library</p>
                  <p className="text-xs text-gray-400">Upload images from the Assets page to use them here.</p>
                </div>
              ) : (
                <>
                  {/* Category filters */}
                  {categories.length > 2 && (
                    <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                            category === cat
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Image grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {filteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => onSelect(asset.url)}
                        className="group text-left"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 transition-colors">
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1.5 truncate">{asset.name}</p>
                        <p className="text-[10px] text-gray-400">{asset.category}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : tab === 'url' ? (
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-3">
                Enter the URL of an image hosted on the web.
              </p>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit(); }}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                      urlError ? 'border-red-300' : 'border-gray-200 focus:border-indigo-300'
                    }`}
                    autoFocus
                  />
                  {urlError && (
                    <p className="text-[11px] text-red-500 mt-1">{urlError}</p>
                  )}
                </div>
                <button
                  onClick={handleUrlSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
                >
                  Use Image
                </button>
              </div>

              {/* Preview */}
              {urlInput.trim() && !urlError && (
                <div className="mt-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Preview</p>
                  <div className="w-40 h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={urlInput.trim()}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : tab === 'dam' ? (
            <DAMBrowserInline onSelect={onSelect} />
          ) : (
            /* AI Generate tab */
            <div className="p-5 space-y-4">
              {/* Content textarea */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Content<span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  value={aiGenForm.content}
                  onChange={(e) => updateAiField('content', e.target.value)}
                  disabled={aiGenerating}
                  rows={3}
                  placeholder="Describe the image you want to create..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-60"
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 mt-1">Do not infringe on copyrighted material.</p>
              </div>

              {/* Style + Aspect Ratio in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Style<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={aiGenForm.style}
                    onChange={(e) => updateAiField('style', e.target.value)}
                    disabled={aiGenerating}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-60 appearance-none bg-white"
                  >
                    <option value="">Select style...</option>
                    <option value="photorealistic">Photorealistic</option>
                    <option value="illustration">Illustration</option>
                    <option value="3d-render">3D Render</option>
                    <option value="flat-design">Flat Design</option>
                    <option value="watercolor">Watercolor</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Aspect Ratio<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={aiGenForm.aspectRatio}
                    onChange={(e) => updateAiField('aspectRatio', e.target.value)}
                    disabled={aiGenerating}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-60 appearance-none bg-white"
                  >
                    <option value="">Select ratio...</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:5">4:5 (Portrait)</option>
                    <option value="9:16">9:16 (Story)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="1.91:1">1.91:1 (Feed Landscape)</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Advanced section */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => updateAiField('advancedOpen', !aiGenForm.advancedOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Advanced Settings
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${aiGenForm.advancedOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {aiGenForm.advancedOpen && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Negative Prompt</label>
                      <textarea
                        value={aiGenForm.negativePrompt}
                        onChange={(e) => updateAiField('negativePrompt', e.target.value)}
                        disabled={aiGenerating}
                        rows={2}
                        placeholder="Elements to avoid in the image..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-60"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Image Size</label>
                        <input
                          type="text"
                          value={aiGenForm.imageSize}
                          onChange={(e) => updateAiField('imageSize', e.target.value)}
                          disabled={aiGenerating}
                          placeholder="e.g. 1024x1024"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quality</label>
                        <select
                          value={aiGenForm.quality}
                          onChange={(e) => updateAiField('quality', e.target.value)}
                          disabled={aiGenerating}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all disabled:opacity-60 appearance-none bg-white"
                        >
                          <option value="">Default</option>
                          <option value="standard">Standard</option>
                          <option value="high">High</option>
                          <option value="ultra">Ultra</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error display */}
              {aiGenError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xs text-red-700">{aiGenError}</span>
                  </div>
                </div>
              )}

              {/* Generating spinner */}
              {aiGenerating && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-indigo-600">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating image...
                </div>
              )}

              {/* Preview area after successful generation */}
              {aiGenPreview && (
                <div className="border border-green-200 bg-green-50/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-medium text-green-800">Image generated</span>
                  </div>
                  <img
                    src={aiGenPreview.previewUrl}
                    alt={aiGenPreview.fileName}
                    className="max-h-48 max-w-full rounded-lg border border-gray-200 shadow-sm mx-auto block"
                  />
                  <p className="text-[10px] text-gray-500 text-center mt-2">
                    {aiGenPreview.fileName} — {(aiGenPreview.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-1">
                {/* Save to library checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToLibrary}
                    onChange={(e) => setSaveToLibrary(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
                  />
                  <span className="text-xs text-gray-500">Save to asset library</span>
                </label>

                <div className="flex items-center gap-2">
                  {aiGenPreview ? (
                    <>
                      <button
                        onClick={() => {
                          setAiGenPreview(null);
                          setAiGenError(null);
                          handleAiGenerate();
                        }}
                        disabled={aiGenerating}
                        className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleUseAiImage}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Use Image
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAiGenerate}
                      disabled={!aiGenForm.content.trim() || !aiGenForm.style || !aiGenForm.aspectRatio || aiGenerating}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

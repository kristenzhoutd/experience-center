/**
 * AssetPickerModal — custom image picker for the GrapesJS editor.
 *
 * Three tabs:
 *  1. Library — browse images from the asset library
 *  2. URL — paste a URL to a web-hosted image
 *  3. Adobe AEM — browse images from AEM DAM (shown when AEM is connected)
 */

import { useState, useEffect, useMemo } from 'react';
import AemBrowserTab from '../../AemBrowserTab';

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

type Tab = 'library' | 'url' | 'aem';

interface AssetPickerModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function AssetPickerModal({ onSelect, onClose }: AssetPickerModalProps) {
  const [tab, setTab] = useState<Tab>('library');
  const [category, setCategory] = useState('All');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [aemConnected, setAemConnected] = useState(false);

  // Load user-uploaded assets from localStorage
  const assets = useMemo(() => loadAssetLibrary(), []);
  const categories = useMemo(() => {
    const cats = new Set(assets.map((a) => a.category));
    return ['All', ...Array.from(cats).sort()];
  }, [assets]);

  // Check AEM connection status on mount
  useEffect(() => {
    window.aiSuites.aem.status().then((res) => {
      if (res.success && res.data?.connected) {
        setAemConnected(true);
      }
    });
  }, []);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[520px] flex flex-col overflow-hidden">
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
          {aemConnected && (
            <button
              onClick={() => setTab('aem')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'aem'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Adobe AEM
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto">
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
          ) : (
            <AemBrowserTab onSelect={(item) => { if (item.deliveryUrl) onSelect(item.deliveryUrl); }} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DAMBrowserInline — Inline DAM browser for the AssetPickerModal.
 * Mirrors the paid-media DAMAssetBrowser layout (provider toggle, search,
 * filters, asset grid + detail panel) but renders without a modal wrapper.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Film, FileText, Image } from 'lucide-react';
import { useDamStore } from '../../../stores/damStore';
import type { DAMFilter } from '../../../types/dam';
import DAMAssetCard from '../../campaign/launch/DAMAssetCard';

const typeIcons = {
  image: Image,
  video: Film,
  document: FileText,
} as const;

const rightsColors = {
  approved: 'text-green-600 bg-green-50',
  restricted: 'text-yellow-600 bg-yellow-50',
  pending: 'text-gray-600 bg-gray-50',
} as const;

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

interface Props {
  onSelect: (url: string) => void;
}

export default function DAMBrowserInline({ onSelect }: Props) {
  const {
    activeProvider,
    assets,
    loading,
    searchQuery,
    filters,
    collections,
    selectedAsset,
    setActiveProvider,
    setSearchQuery,
    setFilter,
    clearFilters,
    searchAssets,
    selectAsset,
    loadProviders,
    loadCollections,
  } = useDamStore();

  const [localQuery, setLocalQuery] = useState('');

  // Initialize data on mount
  useEffect(() => {
    loadProviders();
    loadCollections();
    searchAssets();

    return () => {
      // Reset selection and search on unmount
      selectAsset(null);
      setSearchQuery('');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync local query with store
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback(() => {
    setSearchQuery(localQuery);
    searchAssets();
  }, [localQuery, setSearchQuery, searchAssets]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch],
  );

  const handleUseAsset = useCallback(() => {
    if (!selectedAsset) return;
    onSelect(selectedAsset.fullUrl);
  }, [selectedAsset, onSelect]);

  const hasActiveFilters =
    filters.type !== null ||
    filters.aspectRatio !== null ||
    filters.usageRights !== null ||
    filters.collection !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Provider tabs */}
      <div className="flex gap-2 px-5 pt-3 pb-2 flex-shrink-0">
        {(['aem', 'bynder'] as const).map((id) => (
          <button
            key={id}
            onClick={() => setActiveProvider(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border-none cursor-pointer ${
              activeProvider === id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {id === 'aem' ? 'Adobe AEM' : 'Bynder'}
          </button>
        ))}
      </div>

      {/* Toolbar: search + filters */}
      <div className="px-5 pb-2 flex-shrink-0 space-y-2">
        {/* Search row */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search assets by name, description or tags..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors border-none cursor-pointer disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-400" />

          <select
            value={filters.type || ''}
            onChange={(e) => setFilter('type', (e.target.value || null) as DAMFilter['type'])}
            className="px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-700 bg-white cursor-pointer outline-none focus:border-blue-400"
          >
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>

          <select
            value={filters.aspectRatio || ''}
            onChange={(e) => setFilter('aspectRatio', e.target.value || null)}
            className="px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-700 bg-white cursor-pointer outline-none focus:border-blue-400"
          >
            <option value="">All ratios</option>
            <option value="16:9">16:9</option>
            <option value="1:1">1:1</option>
            <option value="4:5">4:5</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
            <option value="2:1">2:1</option>
          </select>

          <select
            value={filters.usageRights || ''}
            onChange={(e) => setFilter('usageRights', (e.target.value || null) as DAMFilter['usageRights'])}
            className="px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-700 bg-white cursor-pointer outline-none focus:border-blue-400"
          >
            <option value="">All rights</option>
            <option value="approved">Approved</option>
            <option value="restricted">Restricted</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filters.collection || ''}
            onChange={(e) => setFilter('collection', e.target.value || null)}
            className="px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-700 bg-white cursor-pointer outline-none focus:border-blue-400"
          >
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-[10px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors bg-transparent border-none cursor-pointer"
            >
              Clear filters
            </button>
          )}

          <span className="text-[10px] text-gray-400 ml-auto">
            {loading ? '...' : `${assets.length} asset${assets.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Content: Grid + Detail panel */}
      <div className="flex-1 flex overflow-hidden border-t border-gray-100 min-h-0">
        {/* Asset grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-sm">No assets found</span>
              <span className="text-xs mt-1">Try adjusting your search or filters</span>
            </div>
          ) : (
            <div className={`grid gap-2 ${selectedAsset ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {assets.map((asset) => (
                <DAMAssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAsset?.id === asset.id}
                  onSelect={selectAsset}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedAsset && (
          <div className="w-[280px] border-l border-gray-200 overflow-y-auto flex-shrink-0 bg-gray-50/50">
            <div className="p-4 space-y-4">
              {/* Preview */}
              <img
                src={selectedAsset.thumbnailUrl}
                alt={selectedAsset.name}
                className="w-full rounded-lg border border-gray-200"
              />

              {/* Name & provider */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 m-0">{selectedAsset.name}</h4>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-gray-200 text-gray-600">
                  {selectedAsset.provider === 'aem' ? 'Adobe AEM' : 'Bynder'}
                </span>
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-900 font-medium capitalize flex items-center gap-1">
                    {(() => { const Icon = typeIcons[selectedAsset.type]; return <Icon className="w-3 h-3" />; })()}
                    {selectedAsset.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dimensions</span>
                  <span className="text-gray-900 font-medium">
                    {selectedAsset.dimensions.width} x {selectedAsset.dimensions.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Aspect Ratio</span>
                  <span className="text-gray-900 font-medium">{selectedAsset.aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Format</span>
                  <span className="text-gray-900 font-medium">{selectedAsset.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">File Size</span>
                  <span className="text-gray-900 font-medium">{formatFileSize(selectedAsset.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uploaded</span>
                  <span className="text-gray-900 font-medium">{selectedAsset.uploadDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rights</span>
                  <span className={`font-medium capitalize px-1.5 py-0.5 rounded text-[10px] ${rightsColors[selectedAsset.usageRights]}`}>
                    {selectedAsset.usageRights}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Collection</span>
                  <span className="text-gray-900 font-medium text-right max-w-[140px] truncate">{selectedAsset.collection}</span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <span className="text-xs text-gray-500 block mb-1.5">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {selectedAsset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-xs text-gray-500 block mb-1">Description</span>
                <p className="text-xs text-gray-700 m-0 leading-relaxed">{selectedAsset.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 flex-shrink-0">
        <div className="text-xs text-gray-400">
          {selectedAsset
            ? `Selected: ${selectedAsset.name}`
            : 'Click an asset to preview details'}
        </div>
        <button
          onClick={handleUseAsset}
          disabled={!selectedAsset}
          className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none"
        >
          Use Asset
        </button>
      </div>
    </div>
  );
}

/**
 * AemBrowserTab — reusable AEM DAM browser with folder navigation,
 * search, breadcrumbs, and pagination.
 *
 * Used by both AssetPickerModal (GrapesJS editor) and AssetsPage.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AemAssetItem } from '../../electron/utils/ipc-types';

export type { AemAssetItem };

interface AemBrowserTabProps {
  onSelect: (item: AemAssetItem) => void;
}

export default function AemBrowserTab({ onSelect }: AemBrowserTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<AemAssetItem[]>([]);
  const [folderPath, setFolderPath] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const browse = useCallback(async (path: string, appendOffset = 0) => {
    setLoading(true);
    setError('');
    try {
      const result = await window.aiSuites.aem.browse(path, appendOffset, 20);
      if (!result.success) {
        setError(result.error || 'Failed to browse AEM DAM');
        return;
      }
      const data = result.data!;
      if (appendOffset === 0) {
        setItems(data.items);
      } else {
        setItems((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
      setOffset(appendOffset + data.items.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to AEM');
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string, appendOffset = 0) => {
    setLoading(true);
    setError('');
    try {
      const result = await window.aiSuites.aem.search(query, appendOffset, 20);
      if (!result.success) {
        setError(result.error || 'Search failed');
        return;
      }
      const data = result.data!;
      if (appendOffset === 0) {
        setItems(data.items);
      } else {
        setItems((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
      setOffset(appendOffset + data.items.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial browse on mount
  useEffect(() => {
    browse('');
  }, [browse]);

  const handleFolderClick = (item: AemAssetItem) => {
    const newPath = item.path.replace(/^\/content\/dam\/?/, '');
    setFolderPath(newPath);
    setOffset(0);
    setIsSearching(false);
    setSearchQuery('');
    browse(newPath);
  };

  const handleBreadcrumbClick = (index: number) => {
    const segments = (folderPath || '').split('/').filter(Boolean);
    const newPath = index < 0 ? '' : segments.slice(0, index + 1).join('/');
    setFolderPath(newPath);
    setOffset(0);
    setIsSearching(false);
    setSearchQuery('');
    browse(newPath);
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value.trim()) {
      setIsSearching(false);
      setOffset(0);
      browse(folderPath);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(true);
      setOffset(0);
      search(value.trim());
    }, 400);
  };

  const handleLoadMore = () => {
    if (isSearching) {
      search(searchQuery.trim(), offset);
    } else {
      browse(folderPath, offset);
    }
  };

  const handleImageSelect = (item: AemAssetItem) => {
    if (item.deliveryUrl) {
      onSelect(item);
    }
  };

  // Breadcrumb segments
  const pathSegments = (folderPath || '').split('/').filter(Boolean);

  return (
    <div className="p-5">
      {/* Search bar */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="Search images in AEM DAM..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
        />
      </div>

      {/* Breadcrumb */}
      {!isSearching && (
        <div className="flex items-center gap-1 mb-3 text-xs text-gray-500 overflow-x-auto">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="hover:text-gray-900 flex-shrink-0"
          >
            DAM
          </button>
          {pathSegments.map((segment, i) => (
            <span key={i} className="flex items-center gap-1 flex-shrink-0">
              <span className="text-gray-300">/</span>
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className={`hover:text-gray-900 ${i === pathSegments.length - 1 ? 'text-gray-900 font-medium' : ''}`}
              >
                {segment}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search indicator */}
      {isSearching && (
        <p className="text-xs text-gray-500 mb-3">
          Search results for &quot;{searchQuery.trim()}&quot;
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <p className="text-xs text-gray-400">
            Check your AEM connection in{' '}
            <span className="text-primary-600">Personalization Settings</span>.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && items.length === 0 && !error && (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Content grid */}
      {!error && items.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {items.map((item) => (
              item.type === 'folder' ? (
                <button
                  key={item.path}
                  onClick={() => handleFolderClick(item)}
                  className="group text-left"
                >
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 transition-colors flex items-center justify-center bg-gray-50">
                    <svg className="w-10 h-10 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1.5 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">Folder</p>
                </button>
              ) : (
                <button
                  key={item.path}
                  onClick={() => handleImageSelect(item)}
                  className="group text-left"
                >
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 transition-colors">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-100');
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1.5 truncate">{item.title || item.name}</p>
                  {item.dimensions && (
                    <p className="text-[10px] text-gray-400">{item.dimensions.width} x {item.dimensions.height}</p>
                  )}
                </button>
              )
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!error && !loading && items.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            {isSearching ? `No results for "${searchQuery.trim()}"` : 'No images in this folder'}
          </p>
        </div>
      )}
    </div>
  );
}

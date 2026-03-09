/**
 * PreviewContentModal — full-screen modal showing the live website
 * with personalized content injected at configured CSS selectors.
 *
 * Users can switch between variants (Default or segment-specific)
 * and pages to preview all personalizations in context.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCampaignConfigStore } from '../../../stores/campaignConfigStore';
import { usePageStore } from '../../../stores/pageStore';
import { flatFieldsToGjsHtml, RESPONSIVE_BASE_CSS } from './GrapesJSCanvas';
import { buildInjectionScript } from './previewInjectionScript';
import type { ContentPage, ContentSpot, VariantContent } from '../../../types/campaignConfig';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface PreviewContentModalProps {
  onClose: () => void;
  initialPageId?: string;
}

interface InjectionResult {
  injectedCount: number;
  missingSelectors: string[];
}

/** Resolve the URL for a content page */
function resolvePageUrl(
  page: ContentPage,
  savedPages: Array<{ id: string; websiteUrl: string }>,
): string | null {
  const pattern = page.pageUrlPattern;
  if (pattern && /^https?:\/\//.test(pattern)) {
    return pattern;
  }
  const saved = savedPages.find((p) => p.id === page.pageId);
  if (saved?.websiteUrl) {
    return saved.websiteUrl;
  }
  return null;
}

/** Get the HTML/CSS for a variant's content */
function resolveContent(content: VariantContent): { html: string; css: string } {
  if (content.gjsHtml) {
    return { html: content.gjsHtml, css: content.gjsCss || '' };
  }
  const html = flatFieldsToGjsHtml(content);
  return { html, css: '' };
}

/** Gather unique audience variants across all spots on a page */
function getPageAudiences(page: ContentPage): Array<{ audienceRefId: string; audienceName: string }> {
  const seen = new Set<string>();
  const result: Array<{ audienceRefId: string; audienceName: string }> = [];
  for (const spot of page.spots) {
    for (const v of spot.variants) {
      if (!seen.has(v.audienceRefId)) {
        seen.add(v.audienceRefId);
        result.push({ audienceRefId: v.audienceRefId, audienceName: v.audienceName });
      }
    }
  }
  return result;
}

/** Build injection spots for a given variant selection */
function buildSpots(
  page: ContentPage,
  selectedVariant: string, // 'default' or audienceRefId
): Array<{ selector: string; html: string; css: string; spotName: string }> {
  const result: Array<{ selector: string; html: string; css: string; spotName: string }> = [];

  for (const spot of page.spots) {
    let content: VariantContent;

    if (selectedVariant === 'default') {
      content = spot.defaultVariant;
    } else {
      const variant = spot.variants.find((v) => v.audienceRefId === selectedVariant);
      content = variant?.content || spot.defaultVariant;
    }

    const resolved = resolveContent(content);
    if (!resolved.html) continue;

    result.push({
      selector: spot.selector,
      html: resolved.html,
      css: resolved.css,
      spotName: spot.spotName,
    });
  }

  return result;
}

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export default function PreviewContentModal({ onClose, initialPageId }: PreviewContentModalProps) {
  const config = useCampaignConfigStore((s) => s.config);
  const { pages: savedPages } = usePageStore();

  const pages = config?.content.pages || [];

  const [selectedPageId, setSelectedPageId] = useState(initialPageId || pages[0]?.pageId || '');
  const [selectedVariant, setSelectedVariant] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [injectionResult, setInjectionResult] = useState<InjectionResult | null>(null);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const webviewRef = useRef<HTMLWebViewElement | null>(null);

  const currentPage = pages.find((p) => p.pageId === selectedPageId);
  const pageUrl = currentPage ? resolvePageUrl(currentPage, savedPages) : null;
  const audiences = currentPage ? getPageAudiences(currentPage) : [];

  // Run injection script on the webview
  const runInjection = useCallback(() => {
    const webview = webviewRef.current as any;
    if (!webview || !currentPage) return;

    const spots = buildSpots(currentPage, selectedVariant);
    const script = buildInjectionScript(spots, RESPONSIVE_BASE_CSS);

    webview.executeJavaScript(script).then((resultJson: string) => {
      try {
        const result = JSON.parse(resultJson);
        setInjectionResult(result);
      } catch {
        setInjectionResult({ injectedCount: 0, missingSelectors: [] });
      }
    }).catch(() => {
      setInjectionResult({ injectedCount: 0, missingSelectors: [] });
    });
  }, [currentPage, selectedVariant]);

  // Webview lifecycle events
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const onStopLoading = () => {
      setIsLoading(false);
      setLoadError(null);
      runInjection();
    };

    const onStartLoading = () => {
      setIsLoading(true);
      setLoadError(null);
      setInjectionResult(null);
    };

    const onFailLoad = (e: any) => {
      const code = e?.errorCode ?? e?.detail?.errorCode;
      if (code === -3) return; // redirect, not a real error
      const desc = e?.errorDescription ?? e?.detail?.errorDescription ?? 'Failed to load page';
      setLoadError(String(desc));
      setIsLoading(false);
    };

    webview.addEventListener('did-start-loading', onStartLoading);
    webview.addEventListener('did-stop-loading', onStopLoading);
    webview.addEventListener('did-fail-load', onFailLoad);

    return () => {
      webview.removeEventListener('did-start-loading', onStartLoading);
      webview.removeEventListener('did-stop-loading', onStopLoading);
      webview.removeEventListener('did-fail-load', onFailLoad);
    };
  }, [runInjection, pageUrl]);

  // Re-inject when variant changes (no page reload needed)
  useEffect(() => {
    if (!isLoading && !loadError) {
      runInjection();
    }
  }, [selectedVariant]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset variant when page changes
  useEffect(() => {
    setSelectedVariant('default');
    setInjectionResult(null);
  }, [selectedPageId]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const totalSpots = currentPage?.spots.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
           style={{ width: '95vw', height: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50/80 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-gray-900">Preview Content</h3>

            {/* Page selector */}
            {pages.length > 1 && (
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {pages.map((p) => (
                  <option key={p.pageId} value={p.pageId}>{p.pageName}</option>
                ))}
              </select>
            )}

            {/* Variant pills */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedVariant('default')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  selectedVariant === 'default'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Default
              </button>
              {audiences.map((a) => (
                <button
                  key={a.audienceRefId}
                  onClick={() => setSelectedVariant(a.audienceRefId)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    selectedVariant === a.audienceRefId
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {a.audienceName}
                </button>
              ))}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-100 p-4">
          {!pageUrl ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">Unable to preview this page</p>
              <p className="text-xs text-gray-400 mt-1">No URL configured for this page.</p>
            </div>
          ) : (
            <div
              className="relative h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300"
              style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%' }}
            >
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500">Loading page...</p>
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center px-8">
                    <svg className="w-12 h-12 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-700 font-medium mb-1">Failed to load page</p>
                    <p className="text-xs text-gray-400">{loadError}</p>
                  </div>
                </div>
              )}

              {/* Webview */}
              <webview
                ref={webviewRef as any}
                src={pageUrl}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Footer status bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-200 bg-gray-50/80 flex-shrink-0">
          {/* Injection status */}
          <div className="text-[11px] text-gray-500">
            {injectionResult ? (
              <>
                <span className="font-medium text-gray-700">
                  {injectionResult.injectedCount} of {totalSpots}
                </span>
                {' '}spot{totalSpots !== 1 ? 's' : ''} injected
                {injectionResult.missingSelectors.length > 0 && (
                  <span className="ml-2 text-amber-600">
                    ({injectionResult.missingSelectors.length} selector{injectionResult.missingSelectors.length !== 1 ? 's' : ''} not found)
                  </span>
                )}
              </>
            ) : isLoading ? (
              'Loading...'
            ) : (
              'Ready'
            )}
          </div>

          {/* Device toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                device === 'desktop' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Desktop"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
              </svg>
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded-md transition-colors ${
                device === 'tablet' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Tablet (768px)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25V4.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                device === 'mobile' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Mobile (375px)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

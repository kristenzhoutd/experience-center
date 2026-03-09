import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, Group, Separator } from 'react-resizable-panels';
import type { Spot, SavedPage } from '../types/page';
import { usePageStore } from '../stores/pageStore';
import { useChatStore } from '../stores/chatStore';

// Prototype demo data
const DEMO_URL = 'https://www.treasureapparel.com';
const DEMO_PAGE_NAME = 'Homepage';
const DEMO_SPOTS: Spot[] = [
  { id: '1', name: 'Hero Section', type: 'CONTAINER', selector: '#hero-section' },
  { id: '2', name: 'Featured Product 1', type: 'CONTAINER', selector: '.product-card-1' },
  { id: '3', name: 'Featured Product 2', type: 'CONTAINER', selector: '.product-card-2' },
];

export default function PageEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [showWebsitePreview, setShowWebsitePreview] = useState(false);
  const [isPrototypeMode, setIsPrototypeMode] = useState(false);
  const [isWebviewLoading, setIsWebviewLoading] = useState(false);
  const [webviewError, setWebviewError] = useState<string | null>(null);
  const [isPickingMode, setIsPickingMode] = useState(false);
  const [pickerInjected, setPickerInjected] = useState(false);
  const [extractedSpots, setExtractedSpots] = useState<Array<{
    name: string; type: string; selector: string; confidence: string;
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [matchedPageId, setMatchedPageId] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const webviewRef = useRef<HTMLWebViewElement | null>(null);
  const spotsRef = useRef<Spot[]>(spots);
  const extractedSpotsRef = useRef(extractedSpots);
  extractedSpotsRef.current = extractedSpots;

  // Keep spotsRef in sync with spots state
  spotsRef.current = spots;

  // Subscribe to the store's description for this page so updates from
  // the page-description skill (via chat) propagate into the textarea.
  const storeDescription = usePageStore((s) => {
    if (isNew) return undefined;
    return s.pages.find((p) => p.id === id)?.description;
  });

  // Load existing page for editing
  useEffect(() => {
    if (isNew) return;
    const { loadPages, pages } = usePageStore.getState();
    if (pages.length === 0) loadPages();
    const existing = usePageStore.getState().pages.find(p => p.id === id);
    if (existing) {
      setWebsiteUrl(existing.websiteUrl);
      setPageName(existing.pageName);
      setPageDescription(existing.description || '');
      setSpots(existing.spots);
      setShowWebsitePreview(true);
    }
  }, [id, isNew]);

  // Sync description from store when updated externally (e.g. page-description skill).
  // pageDescription is intentionally omitted — we only sync inbound store changes,
  // not re-run when the user edits locally.
  useEffect(() => {
    if (storeDescription !== undefined && storeDescription !== pageDescription) {
      setPageDescription(storeDescription);
      setIsGeneratingDescription(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeDescription]);

  // Generate description via the page-description AI skill
  const handleGenerateDescription = useCallback(async () => {
    if (isGeneratingDescription) return;
    setIsGeneratingDescription(true);

    const chatStore = useChatStore.getState();

    // Ensure a chat session is active
    if (!chatStore.sessionActive) {
      const started = await chatStore.startSession();
      if (!started) {
        setIsGeneratingDescription(false);
        return;
      }
    }

    await chatStore.sendMessage(`Generate page descriptions for my pages`);
  }, [isGeneratingDescription, pageName, websiteUrl]);

  const getPickerScript = (existingSpots: Spot[]) => `
    (function() {
      if (window.__PS_PICKER_INSTALLED__) {
        // Already injected — just restore highlights for existing spots
        var ps = window.__PS_PICKER__;
        if (ps && ps._restoreHighlights) ps._restoreHighlights(${JSON.stringify(existingSpots.map(s => s.selector))});
        return;
      }
      window.__PS_PICKER_INSTALLED__ = true;

      var enabled = false;
      var hoveredEl = null;
      var selectedSelectors = new Set();

      // --- CSS selector generation ---
      function getSelector(el) {
        if (el.id) {
          var byId = '#' + CSS.escape(el.id);
          if (document.querySelectorAll(byId).length === 1) return byId;
        }
        var parts = [];
        var current = el;
        while (current && current !== document.body && current !== document.documentElement) {
          var tag = current.tagName.toLowerCase();
          var parent = current.parentElement;
          if (parent) {
            var siblings = Array.from(parent.children).filter(function(c) { return c.tagName === current.tagName; });
            if (siblings.length > 1) {
              var idx = siblings.indexOf(current) + 1;
              tag += ':nth-of-type(' + idx + ')';
            }
          }
          parts.unshift(tag);
          current = parent;
        }
        var selector = parts.join(' > ');
        // Verify uniqueness
        try {
          if (document.querySelectorAll(selector).length !== 1) {
            // Fallback: add body prefix
            selector = 'body > ' + selector;
          }
        } catch(e) {}
        return selector;
      }

      // --- Element type detection ---
      function getElementType(el) {
        var tag = el.tagName.toLowerCase();
        if (tag === 'img' || tag === 'picture' || tag === 'svg') return 'IMAGE';
        if (tag === 'a' || tag === 'button' || (tag === 'input' && (el.type === 'submit' || el.type === 'button'))) return 'CTA';
        if (/^h[1-6]$/.test(tag)) return 'HEADING';
        if (tag === 'p' || tag === 'span' || tag === 'label') return 'TEXT';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'INPUT';
        if (tag === 'video' || tag === 'audio' || tag === 'iframe') return 'MEDIA';
        if (tag === 'ul' || tag === 'ol' || tag === 'nav') return 'LIST';
        if (tag === 'form') return 'FORM';
        return 'CONTAINER';
      }

      // --- Name generation ---
      function getName(el) {
        var name = el.getAttribute('aria-label')
          || el.getAttribute('alt')
          || el.getAttribute('title')
          || (el.textContent || '').trim().substring(0, 40);
        if (!name) name = el.tagName.toLowerCase();
        return name.length > 40 ? name.substring(0, 37) + '...' : name;
      }

      // --- Highlight helpers ---
      function setHoverHighlight(el) {
        if (!el || selectedSelectors.has(getSelector(el))) return;
        el.style.outline = '2px solid #3B82F6';
        el.style.outlineOffset = '-2px';
      }
      function clearHoverHighlight(el) {
        if (!el) return;
        var sel = getSelector(el);
        if (selectedSelectors.has(sel)) {
          // Restore persistent highlight
          el.style.outline = '2px solid #8B5CF6';
          el.style.outlineOffset = '-2px';
        } else {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }
      }
      function setSelectedHighlight(el) {
        el.style.outline = '2px solid #8B5CF6';
        el.style.outlineOffset = '-2px';
      }

      // --- Event handlers (capture phase) ---
      function onMouseOver(e) {
        if (!enabled) return;
        var el = e.target;
        if (el === document.body || el === document.documentElement) return;
        if (hoveredEl && hoveredEl !== el) clearHoverHighlight(hoveredEl);
        hoveredEl = el;
        setHoverHighlight(el);
      }
      function onMouseOut(e) {
        if (!enabled) return;
        clearHoverHighlight(e.target);
        if (hoveredEl === e.target) hoveredEl = null;
      }
      function onClick(e) {
        if (!enabled) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        var el = e.target;
        if (el === document.body || el === document.documentElement) return;
        var selector = getSelector(el);
        if (selectedSelectors.has(selector)) return; // no duplicates
        selectedSelectors.add(selector);
        setSelectedHighlight(el);
        hoveredEl = null;
        var data = {
          selector: selector,
          type: getElementType(el),
          name: getName(el),
          tagName: el.tagName.toLowerCase(),
          id: el.id || '',
          classes: el.className || '',
          role: el.getAttribute('role') || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          ariaModal: el.getAttribute('aria-modal') || '',
          style: el.getAttribute('style') || '',
          hasImage: !!(el.querySelector('img') || el.querySelector('picture') || el.querySelector('svg')),
          hasHeading: !!(el.querySelector('h1') || el.querySelector('h2') || el.querySelector('h3')),
          parentTag: el.parentElement ? el.parentElement.tagName.toLowerCase() : '',
          parentClasses: el.parentElement ? (el.parentElement.className || '') : '',
          parentId: el.parentElement ? (el.parentElement.id || '') : ''
        };
        console.log('__SPOT_SELECTED__' + JSON.stringify(data));
      }
      function onKeyDown(e) {
        if (e.key === 'Escape' && enabled) {
          console.log('__PICKER_ESCAPE__');
        }
      }

      document.addEventListener('mouseover', onMouseOver, true);
      document.addEventListener('mouseout', onMouseOut, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeyDown, true);

      // --- Control API ---
      window.__PS_PICKER__ = {
        enable: function() { enabled = true; },
        disable: function() {
          enabled = false;
          if (hoveredEl) { clearHoverHighlight(hoveredEl); hoveredEl = null; }
        },
        removeHighlight: function(selector) {
          selectedSelectors.delete(selector);
          try {
            var el = document.querySelector(selector);
            if (el) { el.style.outline = ''; el.style.outlineOffset = ''; }
          } catch(e) {}
        },
        _restoreHighlights: function(selectors) {
          selectors.forEach(function(sel) {
            selectedSelectors.add(sel);
            try {
              var el = document.querySelector(sel);
              if (el) setSelectedHighlight(el);
            } catch(e) {}
          });
        }
      };

      // Restore highlights for existing spots
      var existingSelectors = ${JSON.stringify(existingSpots.map(s => s.selector))};
      existingSelectors.forEach(function(sel) {
        selectedSelectors.add(sel);
        try {
          var el = document.querySelector(sel);
          if (el) setSelectedHighlight(el);
        } catch(e) {}
      });
    })();
  `;

  // --- Spot classification using pre-extracted data + local heuristics ---
  const classifySpotType = (data: {
    selector: string; type: string; name: string; tagName: string;
    id?: string; classes: string; role: string; ariaLabel: string; ariaModal: string;
    style: string; hasImage: boolean; hasHeading: boolean;
    parentTag: string; parentClasses: string; parentId?: string;
  }): { type: string; name: string } => {
    const extracted = extractedSpotsRef.current;
    // 1. Try matching against pre-extracted spots
    if (extracted.length > 0) {
      for (const es of extracted) {
        // Exact match or the picked selector is a descendant of an extracted selector
        if (data.selector === es.selector || data.selector.startsWith(es.selector + ' ')) {
          return { type: es.type, name: es.name };
        }
        // The extracted selector appears within the picked selector (picked parent of extracted)
        if (es.selector.startsWith(data.selector + ' ') || es.selector.startsWith(data.selector + '>')) {
          return { type: es.type, name: es.name };
        }
      }
    }

    // 2. Local heuristic classification
    // Combine class and id into a single string so each rule checks both
    const cls = (data.classes || '').toLowerCase();
    const elId = (data.id || '').toLowerCase();
    const ident = `${cls} ${elId}`;
    const role = (data.role || '').toLowerCase();
    const tag = (data.tagName || '').toLowerCase();
    const style = (data.style || '').toLowerCase();
    const ariaModal = data.ariaModal;
    const parentTag = (data.parentTag || '').toLowerCase();
    const parentCls = (data.parentClasses || '').toLowerCase();
    const parentId = (data.parentId || '').toLowerCase();
    const parentIdent = `${parentCls} ${parentId}`;

    // Hero image / visual
    if (/hero|banner|masthead|jumbotron/.test(ident) || role === 'banner' ||
        (tag === 'section' && data.hasHeading && data.hasImage)) {
      return { type: 'hero_image', name: 'Hero Image' };
    }

    // Navigation menu
    if (tag === 'nav' || role === 'navigation' || /nav-menu|navbar|main-nav|site-nav|navigation/.test(ident)) {
      return { type: 'navigation', name: 'Navigation Menu' };
    }

    // Testimonials & social proof
    if (/testimonial|review|social-proof|trust|client-logo|partner-logo|logo-bar|logo-wall|customer-story/.test(ident)) {
      return { type: 'testimonial', name: 'Testimonial & Social Proof' };
    }

    // Header & greeting
    if (/greeting|welcome|user-greeting|personalize|account-header/.test(ident)) {
      return { type: 'header_greeting', name: 'Header & Greeting' };
    }

    // Product recommendation
    if (/recommend|suggested|you-may-like|also-bought|bestseller|trending|popular|featured-product|product-grid|product-list|product-carousel|related-product/.test(ident) ||
        (tag === 'aside' || role === 'complementary' || /sidebar|rail|skyscraper|side-panel/.test(ident))) {
      return { type: 'product_recommendation', name: 'Product Recommendation' };
    }

    // Modal / popup
    if (tag === 'dialog' || role === 'dialog' || ariaModal === 'true' || /modal|popup|overlay|lightbox|dialog/.test(ident)) {
      return { type: 'custom', name: 'Modal' };
    }

    // Sticky / notification bar
    if (/sticky|fixed|notification-bar|announcement|promo-bar|top-bar/.test(ident) ||
        /position:\s*(fixed|sticky)/.test(style) || role === 'alert' || role === 'status') {
      return { type: 'custom', name: 'Sticky Bar' };
    }

    // CTA button
    if ((tag === 'button' || tag === 'a') && (/cta|primary|call-to-action/.test(ident) ||
        /shop|buy|add.to.cart|sign.up|subscribe|get.started|learn.more/i.test(data.name))) {
      const label = data.name.length > 30 ? data.name.substring(0, 27) + '...' : data.name;
      return { type: 'cta_button', name: `CTA: ${label}` };
    }

    // Headline & copy
    if (/promo|feature|offer|benefits|value-prop|highlights|content-block/.test(ident)) {
      return { type: 'headline', name: 'Headline & Copy' };
    }

    // Hero image / carousel (standalone images)
    if (tag === 'picture' || tag === 'figure' || /carousel|slider|gallery|banner-image|promo-image/.test(ident)) {
      return { type: 'hero_image', name: 'Hero Image / Carousel' };
    }

    // Check parent context for additional signals (class + id)
    if (/hero|banner/.test(parentIdent) && (data.hasImage || data.hasHeading)) {
      return { type: 'hero_image', name: 'Hero Image' };
    }
    if (parentTag === 'aside' || /sidebar|rail/.test(parentIdent)) {
      return { type: 'product_recommendation', name: 'Product Recommendation' };
    }

    // Fallback to basic type detection
    return { type: data.type, name: data.name };
  };

  // Prototype: clicking on any input triggers the demo state
  const handlePrototypeTrigger = () => {
    if (!isPrototypeMode) {
      setWebsiteUrl(DEMO_URL);
      setPageName(DEMO_PAGE_NAME);
      setSpots(DEMO_SPOTS);
      setShowWebsitePreview(true);
      setIsPrototypeMode(true);
    }
  };

  const handleOpenWebsite = () => {
    if (websiteUrl) {
      // Auto-prefix https:// if no protocol is provided
      let url = websiteUrl.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
        setWebsiteUrl(url);
      }

      setWebviewError(null);
      setIsWebviewLoading(true);
      setShowWebsitePreview(true);

      // If creating a new page, check if a saved page already exists for this URL
      if (isNew) {
        const { loadPages, pages } = usePageStore.getState();
        if (pages.length === 0) loadPages();
        const normalize = (u: string) => {
          try { return new URL(u).href.replace(/\/+$/, ''); } catch { return u.toLowerCase().trim(); }
        };
        const normalizedUrl = normalize(url);
        const existing = usePageStore.getState().pages.find(p => normalize(p.websiteUrl) === normalizedUrl);
        if (existing) {
          setMatchedPageId(existing.id);
          setPageName(existing.pageName);
          setSpots(existing.spots);
        } else {
          setMatchedPageId(null);
        }
      }
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleOpenWebsite();
    }
  };

  const injectPickerScript = () => {
    const webview = webviewRef.current as any;
    if (!webview) return;
    const script = getPickerScript(spotsRef.current);
    webview.executeJavaScript(script).then(() => {
      setPickerInjected(true);
    }).catch(() => {
      // Injection may fail if page is not ready; that's okay
    });
  };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const onStartLoading = () => {
      setIsWebviewLoading(true);
      setWebviewError(null);
      setPickerInjected(false);
      setIsPickingMode(false);
    };
    const onStopLoading = () => {
      setIsWebviewLoading(false);
      injectPickerScript();
      // Run web extraction in the background for AI-powered classification
      if (websiteUrl) {
        setIsAnalyzing(true);
        setAnalysisComplete(false);
        window.aiSuites.web.extract(websiteUrl).then((result) => {
          if (result.success && result.data?.spots) {
            setExtractedSpots(result.data.spots.map((s: any) => ({
              name: s.name,
              type: s.type,
              selector: s.selector,
              confidence: s.confidence,
            })));
            setAnalysisComplete(true);
          }
        }).catch(() => {
          // Silent fallback — local heuristics will be used
        }).finally(() => {
          setIsAnalyzing(false);
        });
      }
    };
    const onFailLoad = (_e: Event) => {
      const detail = (_e as CustomEvent).detail || (_e as any);
      const code = detail?.errorCode ?? (detail as any)?.errorCode;
      // errorCode -3 is a cancelled navigation (e.g. redirect), not a real error
      if (code === -3) return;
      const desc = detail?.errorDescription ?? 'Failed to load page';
      setWebviewError(String(desc));
      setIsWebviewLoading(false);
    };
    const onConsoleMessage = (e: any) => {
      const msg: string = e.message ?? '';
      if (msg.startsWith('__SPOT_SELECTED__')) {
        try {
          const data = JSON.parse(msg.slice('__SPOT_SELECTED__'.length));
          // Check for duplicate selector
          if (spotsRef.current.some(s => s.selector === data.selector)) return;
          // Classify using AI-extracted data + local heuristics
          const classified = classifySpotType(data);
          const newSpot: Spot = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            name: classified.name || data.name || data.tagName,
            type: classified.type || data.type || 'CONTAINER',
            selector: data.selector,
          };
          setSpots(prev => [...prev, newSpot]);
        } catch {
          // ignore malformed messages
        }
      } else if (msg === '__PICKER_ESCAPE__') {
        setIsPickingMode(false);
        const wv = webviewRef.current as any;
        if (wv) {
          wv.executeJavaScript('window.__PS_PICKER__ && window.__PS_PICKER__.disable()').catch(() => {});
        }
      }
    };

    webview.addEventListener('did-start-loading', onStartLoading);
    webview.addEventListener('did-stop-loading', onStopLoading);
    webview.addEventListener('did-fail-load', onFailLoad);
    webview.addEventListener('console-message', onConsoleMessage);

    return () => {
      webview.removeEventListener('did-start-loading', onStartLoading);
      webview.removeEventListener('did-stop-loading', onStopLoading);
      webview.removeEventListener('did-fail-load', onFailLoad);
      webview.removeEventListener('console-message', onConsoleMessage);
    };
  }, [showWebsitePreview, isPrototypeMode, websiteUrl]);

  const togglePickingMode = () => {
    const next = !isPickingMode;
    setIsPickingMode(next);
    const webview = webviewRef.current as any;
    if (webview) {
      const cmd = next
        ? 'window.__PS_PICKER__ && window.__PS_PICKER__.enable()'
        : 'window.__PS_PICKER__ && window.__PS_PICKER__.disable()';
      webview.executeJavaScript(cmd).catch(() => {});
    }
  };

  const handleSave = async () => {
    const { savePage } = usePageStore.getState();

    // Capture thumbnail from webview if available
    let thumbnailDataUrl: string | undefined;
    try {
      const wv = webviewRef.current as any;
      if (wv && wv.capturePage) {
        const img = await wv.capturePage();
        thumbnailDataUrl = img.toDataURL();
      }
    } catch {
      // Thumbnail capture may fail; proceed without it
    }

    let hostname = '';
    try {
      hostname = new URL(websiteUrl).hostname;
    } catch {
      hostname = websiteUrl;
    }

    const now = new Date().toISOString();
    // Reuse existing page ID if editing or if a saved page matched by URL
    const effectiveId = !isNew ? id! : matchedPageId;
    const pageId = effectiveId || `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const existingPage = effectiveId ? usePageStore.getState().pages.find(p => p.id === effectiveId) : undefined;

    const page: SavedPage = {
      id: pageId,
      websiteUrl,
      websiteName: hostname,
      pageName: pageName || 'Untitled page',
      description: pageDescription || undefined,
      spots,
      thumbnailDataUrl,
      createdAt: existingPage?.createdAt ?? now,
      updatedAt: now,
    };

    savePage(page);
    navigate('/pages');
  };

  const handleDeleteSpot = (spotId: string) => {
    const spot = spots.find(s => s.id === spotId);
    setSpots(spots.filter(s => s.id !== spotId));
    if (spot) {
      const webview = webviewRef.current as any;
      if (webview) {
        webview.executeJavaScript(
          `window.__PS_PICKER__ && window.__PS_PICKER__.removeHighlight(${JSON.stringify(spot.selector)})`
        ).catch(() => {});
      }
    }
  };


  return (
    <div className="h-full p-4">
      {/* Main container */}
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Group orientation="horizontal">
          {/* Left - Preview */}
          <Panel defaultSize={65} minSize={30}>
            <div className="h-full py-4 px-4">
          <div className="h-full bg-[#fafbfc] rounded-xl flex flex-col items-center justify-center overflow-hidden">
          {showWebsitePreview && isPrototypeMode ? (
            /* Treasure Apparel Ecommerce Preview with AI Highlights */
            <div className="relative w-full h-full flex flex-col m-3 rounded-lg border border-gray-300 shadow-lg overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                {/* URL bar */}
                <div className="flex-1 flex justify-center">
                  <div className="bg-white px-4 py-1 rounded-md text-xs text-gray-500 min-w-[300px] text-center">
                    {websiteUrl}
                  </div>
                </div>
                {/* Browser icons */}
                <div className="flex gap-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Ecommerce Preview Content */}
              <div className="flex-1 bg-white overflow-y-auto overflow-x-visible">
                {/* Navigation bar */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 9L12 22L22 9L12 2Z" />
                    </svg>
                    <div className="flex flex-col leading-none">
                      <span className="text-xs font-bold text-gray-800 tracking-wide">TREASURE</span>
                      <span className="text-[8px] text-gray-500 tracking-widest">APPAREL</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-700">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-amber-600">
                      PROWACE
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <span className="cursor-pointer hover:text-amber-600">GLALLUS</span>
                    <span className="cursor-pointer hover:text-amber-600">FONCTE</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-4 h-4 cursor-pointer hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Hero Banner with AI Highlight */}
                <div className="relative h-56 border-3 border-violet-500 rounded-sm overflow-hidden"
                  style={{ borderWidth: '3px' }}
                >
                  <div className="absolute top-1 left-1 z-30">
                    <div className="bg-violet-500 text-white text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      <span>AI Recommended</span>
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 bg-black/50 text-[10px] text-white px-1.5 py-0.5 rounded z-30">
                    #hero-section
                  </div>

                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80"
                      alt="Athletic lifestyle"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h1 className="text-xl font-bold text-white italic leading-tight drop-shadow-lg">UNLEASH YOUR INNER TREASURE</h1>
                    <p className="text-white/90 text-[11px] mt-1.5 drop-shadow">Comfort. Style. Performance.<br/>Designed for Your Journey</p>
                    <button className="mt-3 bg-amber-500 text-white px-5 py-2 text-xs font-semibold hover:bg-amber-400 transition-colors shadow-lg">
                      SHOP NOW
                    </button>
                  </div>
                </div>

                {/* Products Section */}
                <div className="p-4 pt-6 bg-white overflow-visible">
                  <h2 className="text-sm font-bold text-gray-900 mb-4 tracking-wide">WOMEN'S APPAREL</h2>
                  <div className="grid grid-cols-3 gap-4 overflow-visible">
                    {/* Product 1 with AI Highlight */}
                    <div className="relative rounded-lg border-2 border-violet-500 bg-white overflow-visible">
                      <div className="absolute -top-2 -left-2 z-30">
                        <div className="bg-violet-500 text-white text-[8px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          <span>AI</span>
                        </div>
                      </div>
                      <div className="bg-stone-100 h-24 overflow-hidden rounded-t-md">
                        <img src="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=200&q=80" alt="Leggings" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-1.5">
                        <p className="text-[9px] font-semibold text-gray-900 truncate">TRAILBLAZER LEGGINGS</p>
                        <p className="text-[8px] text-gray-500 truncate">Seamless performance</p>
                        <p className="text-[9px] font-medium text-gray-900">$79.00</p>
                      </div>
                    </div>

                    {/* Product 2 with AI Highlight */}
                    <div className="relative rounded-lg border-2 border-violet-500 bg-white overflow-visible">
                      <div className="absolute -top-2 -left-2 z-30">
                        <div className="bg-violet-500 text-white text-[8px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-md">
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                          <span>AI</span>
                        </div>
                      </div>
                      <div className="bg-stone-100 h-24 overflow-hidden rounded-t-md">
                        <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80" alt="Hoodie" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-1.5">
                        <p className="text-[9px] font-semibold text-gray-900 truncate">ELEMENT HOODIE</p>
                        <p className="text-[8px] text-gray-500 truncate">Cozy everyday comfort</p>
                        <p className="text-[9px] font-medium text-gray-900">$78.00</p>
                      </div>
                    </div>

                    {/* Product 3 */}
                    <div className="relative bg-white rounded-lg overflow-hidden">
                      <div className="bg-stone-100 h-24 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80" alt="Dress" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-1.5">
                        <p className="text-[9px] font-semibold text-gray-900 truncate">ELICIV DORE</p>
                        <p className="text-[8px] text-gray-500 truncate">Premium stretch fabric</p>
                        <p className="text-[9px] font-medium text-gray-900">$78.00</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-emerald-900 text-white px-6 py-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 9L12 22L22 9L12 2Z" />
                        </svg>
                        <div className="flex flex-col leading-none">
                          <span className="text-xs font-bold tracking-wide">TREASURE</span>
                          <span className="text-[8px] text-gray-400 tracking-widest">APPAREL</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 max-w-[120px]">Performance wear designed for your journey.</p>
                    </div>
                    <div className="flex gap-8">
                      <div>
                        <p className="text-[10px] font-semibold mb-2">SHOP</p>
                        <div className="space-y-1">
                          <p className="text-[9px] text-gray-400 hover:text-white cursor-pointer">Women</p>
                          <p className="text-[9px] text-gray-400 hover:text-white cursor-pointer">Men</p>
                          <p className="text-[9px] text-gray-400 hover:text-white cursor-pointer">Accessories</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold mb-2">HELP</p>
                        <div className="space-y-1">
                          <p className="text-[9px] text-gray-400 hover:text-white cursor-pointer">Contact</p>
                          <p className="text-[9px] text-gray-400 hover:text-white cursor-pointer">Shipping</p>
                          <p className="text-[9px] text-gray-400 hover:text-white cursor-pointer">Returns</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-emerald-700 pt-4 flex justify-between items-center">
                    <p className="text-[8px] text-gray-500">© 2024 Treasure Apparel. All rights reserved.</p>
                  </div>
                </div>
              </div>

              {/* AI Insight Tooltip */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-violet-50 border border-violet-200 text-violet-800 text-sm px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span>AI has identified 3 high-impact spots for personalization</span>
                </div>
              </div>
            </div>
          ) : showWebsitePreview ? (
            <div className="w-full h-full flex flex-col m-3 rounded-lg border border-gray-300 shadow-lg overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white px-4 py-1 rounded-md text-xs text-gray-500 min-w-[300px] text-center">
                    {websiteUrl}
                  </div>
                </div>
                {/* Select Element button */}
                <button
                  onClick={togglePickingMode}
                  disabled={isWebviewLoading || !pickerInjected}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    isPickingMode
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title="Select an element on the page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span>Select Element</span>
                </button>
                {/* Analysis status indicator */}
                {isAnalyzing && (
                  <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Analyzing...</span>
                  </div>
                )}
                {!isAnalyzing && analysisComplete && (
                  <div className="flex items-center gap-1 text-green-600 text-[10px]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI analyzed</span>
                  </div>
                )}
              </div>
              {/* Webview */}
              <div className="flex-1 relative">
                {isWebviewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm text-gray-500">Loading website...</p>
                    </div>
                  </div>
                )}
                {webviewError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                    <div className="text-center px-8">
                      <svg className="w-12 h-12 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-700 font-medium mb-1">Failed to load page</p>
                      <p className="text-xs text-gray-400">{webviewError}</p>
                    </div>
                  </div>
                )}
                <webview
                  ref={webviewRef as any}
                  src={websiteUrl}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center px-8">
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm font-medium">Tips</span>
              </div>
              <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                Enter a website URL and click the open link icon to preview the page and select content spots.
              </p>
            </div>
          )}
          </div>
            </div>
          </Panel>

          {/* Resize handle */}
          <Separator className="w-1.5 bg-gray-100 hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Right side - Configuration form */}
          <Panel defaultSize={30} minSize={15}>
            <div className="h-full flex flex-col p-6 overflow-auto border-l border-gray-100">
            <div className="flex-1">
            {/* Website URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Website URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                placeholder="https://example.com/page"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleOpenWebsite}
                disabled={!websiteUrl}
                className="p-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:opacity-80"
                title="Open website preview"
              >
                <svg className="w-5 h-5" fill="none" stroke="#2D40AA" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Page Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Page Name</label>
            <input
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              placeholder="Untitled page"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Page Description */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-900">Description</label>
              {!isNew && (
                <button
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingDescription ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Generate with AI
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2">Purpose of this page and how it can be personalized</p>
            <textarea
              value={pageDescription}
              onChange={(e) => setPageDescription(e.target.value)}
              placeholder="e.g. Homepage is the primary entry point for visitors. The hero banner and product recommendations are ideal for audience-based personalization."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Spots */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Spots</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100 px-3 py-2">
                <span className="text-xs text-gray-500">Elements selected from the target URL will populate here</span>
              </div>
              <div className="p-3">
                {spots.length === 0 ? (
                  <p className="text-xs text-gray-400">No spots selected</p>
                ) : (
                  <div className="space-y-3">
                    {spots.map((spot, index) => (
                      <div key={spot.id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] text-gray-500 font-mono">{spot.selector}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-xs text-gray-600">Spot Name</span>
                            <input
                              type="text"
                              value={spot.name}
                              onChange={(e) => {
                                const newSpots = [...spots];
                                newSpots[index].name = e.target.value;
                                setSpots(newSpots);
                              }}
                              className="flex-1 px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <select
                              value={spot.type}
                              onChange={(e) => {
                                const newSpots = [...spots];
                                newSpots[index] = { ...newSpots[index], type: e.target.value };
                                setSpots(newSpots);
                              }}
                              className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded border-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none pr-4"
                              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
                            >
                              <option value="headline">Headline & Copy</option>
                              <option value="cta_button">CTA Button</option>
                              <option value="hero_image">Hero Image</option>
                              <option value="header_greeting">Header & Greeting</option>
                              <option value="navigation">Navigation</option>
                              <option value="product_recommendation">Product Recommendation</option>
                              <option value="testimonial">Testimonial & Social Proof</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSpot(spot.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

            {/* Save button */}
            <div className="pt-6">
              <button
                onClick={handleSave}
                className="w-full px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save Webpage
              </button>
            </div>
            </div>
          </Panel>
        </Group>
      </div>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: inset 0 0 0 3px #8B5CF6; }
          50% { box-shadow: inset 0 0 0 3px #A78BFA, 0 0 12px rgba(139, 92, 246, 0.4); }
        }
      `}</style>
    </div>
  );
}

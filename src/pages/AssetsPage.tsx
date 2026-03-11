import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';
import {
  loadBrandGuidelines,
  saveBrandGuidelines,
  deleteBrandGuideline as deleteGuidelineFromStorage,
  type BrandGuideline,
} from '../utils/brandGuidelinesStorage';
import {
  loadCompanyContexts,
  deleteCompanyContext as deleteCompanyContextFromStorage,
  type CompanyContext,
} from '../utils/companyContextStorage';
import AemBrowserTab from '../components/AemBrowserTab';
import type { AemAssetItem } from '../components/AemBrowserTab';

interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  category: string;
  dimensions?: string;
}

const UPLOADED_ASSETS_KEY = 'personalization-studio:uploaded-assets';
const categories = ['All', 'Images', 'Brand Guidelines', 'Company Context'];

function loadUploadedAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(UPLOADED_ASSETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUploadedAssets(assets: Asset[]) {
  localStorage.setItem(UPLOADED_ASSETS_KEY, JSON.stringify(assets));
}

interface UploadPreview {
  file: File;
  dataUrl: string;
  name: string;
  dimensions: string;
}

export default function AssetsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>(() => loadUploadedAssets());
  const [companyContexts, setCompanyContexts] = useState<CompanyContext[]>(() => loadCompanyContexts());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null);
  const [uploadName, setUploadName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image lightbox state
  const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null);

  // Guideline viewer/editor state
  const [editingGuideline, setEditingGuideline] = useState<BrandGuideline | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingName, setEditingName] = useState('');

  // Brand guideline state
  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuideline[]>(() => loadBrandGuidelines());
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showAemBrowser, setShowAemBrowser] = useState(false);
  const [aemConnected, setAemConnected] = useState(false);
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [guidelinePreview, setGuidelinePreview] = useState<string | null>(null);
  const [guidelineName, setGuidelineName] = useState('');
  const [guidelineFile, setGuidelineFile] = useState<File | null>(null);
  const guidelineInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  // AI Image Generation state
  const [showAiGenModal, setShowAiGenModal] = useState(false);
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
  const [aiGenName, setAiGenName] = useState('');

  const allAssets = uploadedAssets;

  const filteredAssets = selectedCategory === 'All' || selectedCategory === 'Images'
    ? allAssets
    : [];

  const filteredGuidelines = selectedCategory === 'All' || selectedCategory === 'Brand Guidelines'
    ? brandGuidelines
    : [];

  const filteredCompanyContexts = selectedCategory === 'All' || selectedCategory === 'Company Context'
    ? companyContexts
    : [];

  const hasContent = filteredAssets.length > 0 || filteredGuidelines.length > 0 || filteredCompanyContexts.length > 0;

  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setUploadPreview({
          file,
          dataUrl,
          name: baseName,
          dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
        });
        setUploadName(baseName);
        setShowUploadModal(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  }, []);

  const handleSaveUpload = useCallback(() => {
    if (!uploadPreview) return;

    const newAsset: Asset = {
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: uploadName.trim() || uploadPreview.name,
      url: uploadPreview.dataUrl,
      type: 'image',
      category: 'Images',
      dimensions: uploadPreview.dimensions,
    };

    const updated = [...uploadedAssets, newAsset];
    setUploadedAssets(updated);
    saveUploadedAssets(updated);
    setShowUploadModal(false);
    setUploadPreview(null);
    setUploadName('');
  }, [uploadPreview, uploadName, uploadedAssets]);

  const handleCancelUpload = useCallback(() => {
    setShowUploadModal(false);
    setUploadPreview(null);
    setUploadName('');
  }, []);

  // Guideline file handler
  const handleGuidelineFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');

    if (ext === 'txt' || ext === 'md') {
      const reader = new FileReader();
      reader.onload = () => {
        setGuidelinePreview(reader.result as string);
        setGuidelineName(baseName);
        setGuidelineFile(file);
        setShowGuidelineModal(true);
      };
      reader.readAsText(file);
    } else if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
        try {
          const result = await window.aiSuites.pdf.extract(base64, file.name);
          if (result.success && result.text) {
            setGuidelinePreview(result.text);
          } else {
            setGuidelinePreview(`[PDF extraction failed: ${result.error || 'Unknown error'}]`);
          }
        } catch {
          setGuidelinePreview('[PDF extraction unavailable — text could not be extracted]');
        }
        setGuidelineName(baseName);
        setGuidelineFile(file);
        setShowGuidelineModal(true);
      };
      reader.readAsDataURL(file);
    } else if (ext === 'docx') {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          setGuidelinePreview(result.value);
        } catch {
          setGuidelinePreview('[DOCX extraction failed — could not parse file]');
        }
        setGuidelineName(baseName);
        setGuidelineFile(file);
        setShowGuidelineModal(true);
      };
      reader.readAsArrayBuffer(file);
    }

    e.target.value = '';
  }, []);

  const handleSaveGuideline = useCallback(() => {
    if (!guidelinePreview || !guidelineFile) return;

    const ext = guidelineFile.name.split('.').pop()?.toUpperCase() || 'TXT';
    const newGuideline: BrandGuideline = {
      id: `guideline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: guidelineName.trim() || guidelineFile.name,
      content: guidelinePreview,
      fileType: ext,
      fileSize: guidelineFile.size,
      uploadedAt: new Date().toISOString(),
    };

    const updated = [...brandGuidelines, newGuideline];
    setBrandGuidelines(updated);
    saveBrandGuidelines(updated);
    setShowGuidelineModal(false);
    setGuidelinePreview(null);
    setGuidelineName('');
    setGuidelineFile(null);
  }, [guidelinePreview, guidelineName, guidelineFile, brandGuidelines]);

  const handleCancelGuideline = useCallback(() => {
    setShowGuidelineModal(false);
    setGuidelinePreview(null);
    setGuidelineName('');
    setGuidelineFile(null);
  }, []);

  const handleDeleteGuideline = useCallback((id: string) => {
    deleteGuidelineFromStorage(id);
    setBrandGuidelines((prev) => prev.filter((g) => g.id !== id));
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleOpenGuideline = useCallback((guideline: BrandGuideline) => {
    setEditingGuideline(guideline);
    setEditingContent(guideline.content);
    setEditingName(guideline.name);
  }, []);

  const handleSaveGuidelineEdit = useCallback(() => {
    if (!editingGuideline) return;
    const updated = brandGuidelines.map((g) =>
      g.id === editingGuideline.id
        ? { ...g, name: editingName.trim() || g.name, content: editingContent }
        : g
    );
    setBrandGuidelines(updated);
    saveBrandGuidelines(updated);
    setEditingGuideline(null);
  }, [editingGuideline, editingContent, editingName, brandGuidelines]);

  const handleCancelGuidelineEdit = useCallback(() => {
    setEditingGuideline(null);
  }, []);

  const handleDeleteSelected = useCallback(() => {
    // Delete selected images
    const remainingAssets = uploadedAssets.filter((a) => !selectedAssets.has(a.id));
    setUploadedAssets(remainingAssets);
    saveUploadedAssets(remainingAssets);

    // Delete selected guidelines
    const remainingGuidelines = brandGuidelines.filter((g) => !selectedAssets.has(g.id));
    setBrandGuidelines(remainingGuidelines);
    saveBrandGuidelines(remainingGuidelines);

    // Delete selected company contexts
    for (const ctx of companyContexts) {
      if (selectedAssets.has(ctx.id)) {
        deleteCompanyContextFromStorage(ctx.id);
      }
    }
    setCompanyContexts((prev) => prev.filter((c) => !selectedAssets.has(c.id)));

    setSelectedAssets(new Set());
  }, [uploadedAssets, brandGuidelines, companyContexts, selectedAssets]);

  // Check AEM connection status on mount
  useEffect(() => {
    window.aiSuites.aem.status().then((res) => {
      if (res.success && res.data?.connected) {
        setAemConnected(true);
      }
    });
  }, []);

  // Handle AEM asset selection
  const handleAemSelect = useCallback((item: AemAssetItem) => {
    const newAsset: Asset = {
      id: `aem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: item.title || item.name,
      url: item.deliveryUrl || item.thumbnailUrl,
      type: 'image',
      category: 'Images',
      dimensions: item.dimensions ? `${item.dimensions.width}x${item.dimensions.height}` : undefined,
    };

    const updated = [...uploadedAssets, newAsset];
    setUploadedAssets(updated);
    saveUploadedAssets(updated);
    setShowAemBrowser(false);
  }, [uploadedAssets]);

  // AI Image Generation handlers
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
        setAiGenName(result.file.fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
      } else {
        setAiGenError(result.error || 'Image generation failed');
      }
    } catch (err) {
      setAiGenError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setAiGenerating(false);
    }
  }, [aiGenForm]);

  const handleSaveAiImage = useCallback(() => {
    if (!aiGenPreview) return;

    const newAsset: Asset = {
      id: `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: aiGenName.trim() || aiGenPreview.fileName,
      url: aiGenPreview.previewUrl,
      type: 'image',
      category: 'Images',
    };

    const updated = [...uploadedAssets, newAsset];
    setUploadedAssets(updated);
    saveUploadedAssets(updated);
    setShowAiGenModal(false);
    setAiGenForm({ content: '', style: '', aspectRatio: '', purpose: '', negativePrompt: '', imageSize: '', quality: '', advancedOpen: false });
    setAiGenPreview(null);
    setAiGenName('');
    setAiGenError(null);
  }, [aiGenPreview, aiGenName, uploadedAssets]);

  const handleCancelAiGen = useCallback(() => {
    setShowAiGenModal(false);
    setAiGenForm({ content: '', style: '', aspectRatio: '', purpose: '', negativePrompt: '', imageSize: '', quality: '', advancedOpen: false });
    setAiGenPreview(null);
    setAiGenName('');
    setAiGenError(null);
  }, []);

  // Close upload menu on outside click
  useEffect(() => {
    if (!showUploadMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target as Node)) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUploadMenu]);

  // Close modals / lightbox on Escape
  useEffect(() => {
    if (!showUploadModal && !showGuidelineModal && !lightboxAsset && !editingGuideline && !showAemBrowser && !showAiGenModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAiGenModal) handleCancelAiGen();
        else if (showAemBrowser) setShowAemBrowser(false);
        else if (editingGuideline) handleCancelGuidelineEdit();
        else if (lightboxAsset) setLightboxAsset(null);
        else if (showGuidelineModal) handleCancelGuideline();
        else handleCancelUpload();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showUploadModal, showGuidelineModal, lightboxAsset, editingGuideline, showAemBrowser, showAiGenModal, handleCancelUpload, handleCancelGuideline, handleCancelGuidelineEdit, handleCancelAiGen]);

  return (
    <div className="h-full p-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={guidelineInputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx"
        className="hidden"
        onChange={handleGuidelineFileSelect}
      />

      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Assets</h1>
            <p className="text-sm text-gray-500 mt-1">Images and brand guidelines for your campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedAssets.size > 0 && (
              <>
                <span className="text-sm text-gray-500">{selectedAssets.size} selected</span>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
            {/* Upload dropdown */}
            <div className="relative" ref={uploadMenuRef}>
              <button
                onClick={() => setShowUploadMenu((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUploadMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      setShowUploadMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Image</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WebP</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadMenu(false);
                      setShowAiGenModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">AI Image Generation</p>
                      <p className="text-xs text-gray-400">Generate with AI agent</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadMenu(false);
                      guidelineInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Brand Guideline</p>
                      <p className="text-xs text-gray-400">TXT, Markdown, PDF, DOCX</p>
                    </div>
                  </button>
                  {aemConnected && (
                    <button
                      onClick={() => {
                        setShowUploadMenu(false);
                        setShowAemBrowser(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H6.375L.493 16.476h2.479l1.592-4.281h4.63L8.884 1.376zm6.46 0L11.406 12.17l-1.653-4.281-2.836 8.587h2.508l1.69 4.281L22.376 1.376h-2.508l-4.524 10.855z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Adobe AEM</p>
                        <p className="text-xs text-gray-400">Browse AEM DAM</p>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowUploadMenu(false);
                      navigate('/company-context', { state: { createNew: true } });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Company Context</p>
                      <p className="text-xs text-gray-400">Build from URL or chat</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category filters */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Asset grid */}
        <div className="p-6">
          {!hasContent ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">No assets yet</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Upload images or brand guidelines to get started. Brand guidelines will be automatically referenced when checking content for brand compliance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-4">
              {/* Image cards */}
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => toggleAssetSelection(asset.id)}
                  className="group cursor-pointer"
                >
                  <div className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedAssets.has(asset.id)
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="absolute inset-0 z-10 w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-black transition-opacity rounded-xl ${
                      selectedAssets.has(asset.id) ? 'bg-opacity-20' : 'bg-opacity-0 group-hover:bg-opacity-10'
                    }`} />
                    <div className={`absolute z-20 top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedAssets.has(asset.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300 opacity-0 group-hover:opacity-100'
                    }`}>
                      {selectedAssets.has(asset.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Expand button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxAsset(asset);
                      }}
                      className="absolute z-20 top-2 right-2 w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 truncate">{asset.name}</p>
                    <p className="text-xs text-gray-400">Image</p>
                  </div>
                </div>
              ))}

              {/* Guideline cards */}
              {filteredGuidelines.map((guideline) => (
                <div
                  key={guideline.id}
                  onClick={() => toggleAssetSelection(guideline.id)}
                  className="group cursor-pointer"
                >
                  <div className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedAssets.has(guideline.id)
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    {/* Text preview */}
                    <div className="absolute inset-0 z-10 bg-gray-50 p-3 overflow-hidden">
                      <p className="text-[9px] leading-[13px] text-gray-500 font-mono whitespace-pre-wrap break-words">
                        {guideline.content.slice(0, 300)}
                      </p>
                      {/* Fade-out at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 to-transparent" />
                    </div>

                    {/* Hover overlay */}
                    <div className={`absolute inset-0 bg-black transition-opacity rounded-xl ${
                      selectedAssets.has(guideline.id) ? 'bg-opacity-20' : 'bg-opacity-0 group-hover:bg-opacity-10'
                    }`} />

                    {/* Selection checkbox */}
                    <div className={`absolute z-20 top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectedAssets.has(guideline.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300 opacity-0 group-hover:opacity-100'
                    }`}>
                      {selectedAssets.has(guideline.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Open button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGuideline(guideline);
                      }}
                      className="absolute z-20 top-2 right-2 w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-gray-700 truncate">{guideline.name}</p>
                    <p className="text-xs text-gray-400">Brand Guideline</p>
                  </div>
                </div>
              ))}

              {/* Company context cards */}
              {filteredCompanyContexts.map((ctx) => {
                // Build section summary counts
                const sections: string[] = [];
                if (ctx.competitors.length > 0) sections.push(`${ctx.competitors.length} competitor${ctx.competitors.length !== 1 ? 's' : ''}`);
                if (ctx.personas.length > 0) sections.push(`${ctx.personas.length} persona${ctx.personas.length !== 1 ? 's' : ''}`);
                if (ctx.regulatoryFrameworks.length > 0) sections.push(`${ctx.regulatoryFrameworks.length} framework${ctx.regulatoryFrameworks.length !== 1 ? 's' : ''}`);
                if (ctx.categoryBenchmarks.length > 0) sections.push(`${ctx.categoryBenchmarks.length} benchmark${ctx.categoryBenchmarks.length !== 1 ? 's' : ''}`);
                if (ctx.seasonalTrends.length > 0) sections.push(`${ctx.seasonalTrends.length} trend${ctx.seasonalTrends.length !== 1 ? 's' : ''}`);
                const summary = sections.length > 0 ? sections.join(' \u00B7 ') : '';

                return (
                  <div
                    key={ctx.id}
                    className="group cursor-pointer"
                    onClick={() => navigate('/company-context', { state: { contextId: ctx.id } })}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-purple-300 transition-all">
                      <div className="absolute inset-0 z-10 bg-purple-50 p-3 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-[10px] font-semibold text-purple-700 uppercase">Company Context</span>
                        </div>
                        <p className="text-xs font-medium text-gray-800 mb-1">{ctx.companyDescription.name || 'Unnamed'}</p>
                        {ctx.industry?.primary && (
                          <p className="text-[10px] text-purple-600 mb-1.5">{ctx.industry.primary}{ctx.industry.subIndustry ? ` / ${ctx.industry.subIndustry}` : ''}</p>
                        )}
                        <p className="text-[9px] leading-[13px] text-gray-500 break-words flex-1">
                          {ctx.companyDescription.description.slice(0, 150)}
                        </p>
                        {summary && (
                          <p className="text-[9px] text-purple-500 mt-1.5 font-medium">{summary}</p>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-purple-50 to-transparent" />
                      </div>

                      {/* Selection checkbox */}
                      <div className={`absolute z-20 top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedAssets.has(ctx.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-white border-gray-300 opacity-0 group-hover:opacity-100'
                      }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAssetSelection(ctx.id);
                        }}
                      >
                        {selectedAssets.has(ctx.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Edit button on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/company-context', { state: { contextId: ctx.id } });
                        }}
                        className="absolute z-20 top-2 right-2 w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        title="Edit company context"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm text-gray-700 truncate">{ctx.companyDescription.name || 'Company Context'}</p>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs text-gray-400">Company Context</p>
                        {ctx.lastUpdated && (
                          <span className="text-[10px] text-gray-300">&middot; {new Date(ctx.lastUpdated).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Image Upload Preview Modal */}
      {showUploadModal && uploadPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelUpload} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Upload Image</h3>
              <button
                onClick={handleCancelUpload}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview */}
            <div className="px-6 pt-5">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                <img
                  src={uploadPreview.dataUrl}
                  alt="Upload preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {uploadPreview.dimensions} &middot; {(uploadPreview.file.size / 1024).toFixed(0)} KB
              </p>
            </div>

            {/* Form */}
            <div className="px-6 pt-4 pb-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Asset name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                  autoFocus
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 mt-2">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUpload}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Overlay */}
      {lightboxAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setLightboxAsset(null)} />
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxAsset(null)}
              className="absolute -top-10 right-0 p-1 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxAsset.url}
              alt={lightboxAsset.name}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-white">{lightboxAsset.name}</p>
              {lightboxAsset.dimensions && (
                <p className="text-xs text-white/60 mt-0.5">{lightboxAsset.dimensions}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Brand Guideline Preview Modal */}
      {showGuidelineModal && guidelinePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelGuideline} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[540px] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Upload Brand Guideline</h3>
              <button
                onClick={handleCancelGuideline}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Format hint */}
            <div className="px-6 pt-4">
              <p className="text-xs text-gray-400">Supported formats: TXT, Markdown, PDF, DOCX</p>
            </div>

            {/* Preview */}
            <div className="px-6 pt-3">
              <div className="w-full h-64 rounded-xl overflow-auto border border-gray-200 bg-gray-50 p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {guidelinePreview.slice(0, 3000)}
                  {guidelinePreview.length > 3000 && '\n\n... (content truncated for preview)'}
                </pre>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {guidelinePreview.length.toLocaleString()} characters &middot; {guidelineFile ? (guidelineFile.size / 1024).toFixed(0) : '0'} KB
              </p>
            </div>

            {/* Name input */}
            <div className="px-6 pt-4 pb-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={guidelineName}
                onChange={(e) => setGuidelineName(e.target.value)}
                placeholder="Guideline name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 mt-2">
              <button
                onClick={handleCancelGuideline}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuideline}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AEM DAM Browser Modal */}
      {showAemBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAemBrowser(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[520px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Browse Adobe AEM</h3>
              <button
                onClick={() => setShowAemBrowser(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto">
              <AemBrowserTab onSelect={handleAemSelect} />
            </div>
          </div>
        </div>
      )}

      {/* AI Image Generation Modal */}
      {showAiGenModal && (() => {
        const canGenerate = aiGenForm.content.trim() && aiGenForm.style && aiGenForm.aspectRatio;
        const fieldLabel = "text-sm font-medium text-gray-700 pt-2";
        const selectClass = "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all disabled:opacity-60 cursor-pointer appearance-none";
        const updateAiField = (field: string, value: string | boolean) =>
          setAiGenForm((prev) => ({ ...prev, [field]: value }));
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={!aiGenerating ? handleCancelAiGen : undefined} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">AI Image Generation</h3>
              </div>
              <button
                onClick={handleCancelAiGen}
                disabled={aiGenerating}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              {/* Content */}
              <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Content<span className="text-red-500 ml-0.5">*</span></label>
                <div>
                  <textarea
                    value={aiGenForm.content}
                    onChange={(e) => updateAiField('content', e.target.value)}
                    disabled={aiGenerating}
                    rows={4}
                    placeholder="Describe the image you want to create as specifically as possible."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-vertical focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all disabled:opacity-60"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">Do not infringe on copyrighted material.</p>
                </div>
              </div>

              {/* Style */}
              <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Style<span className="text-red-500 ml-0.5">*</span></label>
                <select
                  value={aiGenForm.style}
                  onChange={(e) => updateAiField('style', e.target.value)}
                  disabled={aiGenerating}
                  className={selectClass}
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
              <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Aspect Ratio<span className="text-red-500 ml-0.5">*</span></label>
                <select
                  value={aiGenForm.aspectRatio}
                  onChange={(e) => updateAiField('aspectRatio', e.target.value)}
                  disabled={aiGenerating}
                  className={selectClass}
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
              <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start">
                <label className={fieldLabel}>Purpose</label>
                <textarea
                  value={aiGenForm.purpose}
                  onChange={(e) => updateAiField('purpose', e.target.value)}
                  disabled={aiGenerating}
                  rows={2}
                  placeholder="Where this image will be used and its purpose"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-vertical focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all disabled:opacity-60"
                />
              </div>

              {/* Advanced Settings */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => updateAiField('advancedOpen', !aiGenForm.advancedOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 bg-transparent border-none cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Advanced Settings
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${aiGenForm.advancedOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {aiGenForm.advancedOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start">
                      <label className={fieldLabel}>Negative Prompt</label>
                      <textarea
                        value={aiGenForm.negativePrompt}
                        onChange={(e) => updateAiField('negativePrompt', e.target.value)}
                        disabled={aiGenerating}
                        rows={2}
                        placeholder="Describe elements to avoid in the image"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-vertical focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all disabled:opacity-60"
                      />
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start">
                      <label className={fieldLabel}>Image Size</label>
                      <input
                        type="text"
                        value={aiGenForm.imageSize}
                        onChange={(e) => updateAiField('imageSize', e.target.value)}
                        disabled={aiGenerating}
                        placeholder="Example: 1024 x 1024"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all disabled:opacity-60"
                      />
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start">
                      <label className={fieldLabel}>Quality</label>
                      <select
                        value={aiGenForm.quality}
                        onChange={(e) => updateAiField('quality', e.target.value)}
                        disabled={aiGenerating}
                        className={selectClass}
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
              {aiGenPreview && (
                <div className="border border-green-200 bg-green-50/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Image generated successfully</span>
                  </div>
                  <img
                    src={aiGenPreview.previewUrl}
                    alt={aiGenPreview.fileName}
                    className="max-h-64 max-w-full rounded-lg border border-gray-200 shadow-sm mx-auto block"
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    {aiGenPreview.fileName} — {(aiGenPreview.fileSize / 1024).toFixed(1)} KB
                  </p>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Asset Name</label>
                    <input
                      type="text"
                      value={aiGenName}
                      onChange={(e) => setAiGenName(e.target.value)}
                      placeholder="Asset name"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {aiGenError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xs text-red-700 flex-1 whitespace-pre-line">{aiGenError}</span>
                  </div>
                </div>
              )}

              {/* Generating status */}
              {aiGenerating && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating image with AI agent...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              {aiGenPreview ? (
                <>
                  <button
                    onClick={() => {
                      setAiGenPreview(null);
                      setAiGenError(null);
                      handleAiGenerate();
                    }}
                    disabled={aiGenerating}
                    className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handleSaveAiImage}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Save to Library
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelAiGen}
                    disabled={aiGenerating}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAiGenerate}
                    disabled={!canGenerate || aiGenerating}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Generate
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Guideline Editor Modal */}
      {editingGuideline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancelGuidelineEdit} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">Brand Guideline</h3>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded">
                  {editingGuideline.fileType}
                </span>
              </div>
              <button
                onClick={handleCancelGuidelineEdit}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Name input */}
            <div className="px-6 pt-4 flex-shrink-0">
              <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>

            {/* Editable content */}
            <div className="px-6 pt-3 pb-2 flex-1 min-h-0">
              <label className="block text-xs font-medium text-gray-500 mb-1">Content</label>
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-full min-h-[300px] px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400">
                {editingContent.length.toLocaleString()} characters
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelGuidelineEdit}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGuidelineEdit}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

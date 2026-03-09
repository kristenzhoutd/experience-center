import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageStore } from '../stores/pageStore';
import type { SavedPage } from '../types/page';

interface WebsiteGroup {
  hostname: string;
  origin: string;
  pages: SavedPage[];
}

export default function PagesPage() {
  const navigate = useNavigate();
  const { pages, loadPages } = usePageStore();
  const [expandedWebsites, setExpandedWebsites] = useState<Set<string>>(new Set());
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const { deletePage } = usePageStore();

  const handleDelete = (pageId: string) => {
    deletePage(pageId);
    setShowDeleteModal(null);
  };

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  // Group pages by hostname
  const websiteGroups = useMemo(() => {
    const grouped: Record<string, WebsiteGroup> = {};
    for (const page of pages) {
      const key = page.websiteName;
      if (!grouped[key]) {
        let origin = page.websiteUrl;
        try {
          origin = new URL(page.websiteUrl).origin;
        } catch {
          // keep raw URL
        }
        grouped[key] = { hostname: key, origin, pages: [] };
      }
      grouped[key].pages.push(page);
    }
    return Object.values(grouped);
  }, [pages]);

  // Expand new websites by default when pages change
  useEffect(() => {
    const allHostnames = new Set(websiteGroups.map(g => g.hostname));
    setExpandedWebsites(prev => {
      const next = new Set(prev);
      for (const h of allHostnames) {
        next.add(h);
      }
      return next;
    });
  }, [websiteGroups]);

  const toggleWebsite = (hostname: string) => {
    const newExpanded = new Set(expandedWebsites);
    if (newExpanded.has(hostname)) {
      newExpanded.delete(hostname);
    } else {
      newExpanded.add(hostname);
    }
    setExpandedWebsites(newExpanded);
  };

  return (
    <div className="h-full p-4">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-medium text-gray-900">Pages</h1>
          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Add New Page
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAddDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    navigate('/pages/new');
                    setShowAddDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  New Page
                </button>
                <button
                  onClick={() => setShowAddDropdown(false)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  New Website
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Website sections */}
        <div className="px-6 pb-6 space-y-8">
          {websiteGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500 mb-1">No pages saved yet</p>
              <p className="text-xs text-gray-400 mb-4">Add a new page to get started with personalization</p>
              <button
                onClick={() => navigate('/pages/new')}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add New Page
              </button>
            </div>
          ) : (
            websiteGroups.map((group) => (
              <div key={group.hostname}>
                {/* Website header */}
                <button
                  onClick={() => toggleWebsite(group.hostname)}
                  className="flex items-center gap-2 pb-3 border-b border-gray-300 w-full group"
                >
                  <span className="text-sm font-medium text-gray-900">{group.hostname}</span>
                  <span className="text-sm text-gray-400">{group.origin}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedWebsites.has(group.hostname) ? '' : '-rotate-90'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Page cards grid */}
                {expandedWebsites.has(group.hostname) && (
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {group.pages.map((page) => (
                      <div key={page.id} className="group relative">
                        <Link to={`/pages/${page.id}`}>
                          {/* Thumbnail */}
                          <div className="aspect-[4/3] bg-gray-100 rounded-xl border border-gray-200 overflow-hidden mb-2 group-hover:border-gray-300 transition-colors">
                            {page.thumbnailDataUrl ? (
                              <img
                                src={page.thumbnailDataUrl}
                                alt={page.pageName}
                                className="w-full h-full object-cover object-top"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs text-gray-400">No preview</span>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Page name */}
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">{page.pageName}</span>
                        </Link>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteModal(page.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          title="Delete page"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Page</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this page and all its configured spots? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { contentSpotApi } from '../api/client';

const spotTypes = [
  { value: 'headline', label: 'Headline & Copy' },
  { value: 'cta_button', label: 'CTA Button' },
  { value: 'hero_image', label: 'Hero Image' },
  { value: 'header_greeting', label: 'Header & Greeting' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'product_recommendation', label: 'Product Recommendation' },
  { value: 'testimonial', label: 'Testimonial & Social Proof' },
  { value: 'custom', label: 'Custom' },
];

export default function VisualEditorPage() {
  const { organizationId } = useAppStore();
  const [url, setUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'headline',
    selector: '',
  });

  const handleLoadSite = () => {
    if (url) {
      setIsLoaded(true);
    }
  };

  const handleSaveContentSpot = async () => {
    try {
      await contentSpotApi.create({
        organizationId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        selector: formData.selector,
        pageUrl: url,
      });

      setShowForm(false);
      setFormData({ name: '', description: '', type: 'headline', selector: '' });
      setSelectedElement(null);
      alert('Content spot saved!');
    } catch (error) {
      console.error('Failed to save content spot:', error);
      alert('Failed to save content spot');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Visual Editor</h2>
        <p className="text-sm text-gray-500">Load your website and click on elements to mark them as content spots</p>
      </div>

      {/* URL input */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter your website URL (e.g., https://example.com)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={handleLoadSite}
          disabled={!url}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          Load Site
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex">
        {/* Preview area */}
        <div className="flex-1 bg-gray-100 relative">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">🌐</div>
                <p className="text-gray-500">Enter a URL above to load your website</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center p-8 max-w-md">
                <div className="text-4xl mb-4">🚧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Visual Editor Preview</h3>
                <p className="text-gray-500 mb-4">
                  In production, this would load your website in an iframe with element selection capabilities.
                  For security reasons, many sites block iframe embedding.
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  URL: {url}
                </p>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setFormData({ ...formData, selector: '#hero-banner' });
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                >
                  Add Content Spot Manually
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        {showForm && (
          <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-4">New Content Spot</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Homepage Hero"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this content spot used for?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {spotTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSS Selector</label>
                <input
                  type="text"
                  value={formData.selector}
                  onChange={(e) => setFormData({ ...formData, selector: e.target.value })}
                  placeholder="e.g., #hero-banner, .main-cta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveContentSpot}
                  disabled={!formData.name || !formData.selector}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

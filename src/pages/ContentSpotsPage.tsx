import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { contentSpotApi } from '../api/client';

const spotTypeLabels: Record<string, string> = {
  headline: 'Headline & Copy',
  cta_button: 'CTA Button',
  hero_image: 'Hero Image',
  header_greeting: 'Header & Greeting',
  navigation: 'Navigation',
  product_recommendation: 'Product Recommendation',
  testimonial: 'Testimonial & Social Proof',
  custom: 'Custom',
};

export default function ContentSpotsPage() {
  const { organizationId, contentSpots, setContentSpots } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContentSpots();
  }, [organizationId]);

  const loadContentSpots = async () => {
    try {
      const data = await contentSpotApi.list(organizationId);
      setContentSpots(data);
    } catch (error) {
      console.error('Failed to load content spots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content spot?')) return;

    try {
      await contentSpotApi.delete(id);
      loadContentSpots();
    } catch (error) {
      console.error('Failed to delete content spot:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading content spots...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Content Spots</h2>
            <p className="text-sm text-gray-500">Define areas on your website that can be personalized</p>
          </div>
          <Link
            to="/visual-editor"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Open Visual Editor
          </Link>
        </div>
      </div>

      <div className="p-6">
        {contentSpots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content spots defined</h3>
            <p className="text-gray-500 mb-4">Use the Visual Editor to mark areas on your website for personalization</p>
            <Link
              to="/visual-editor"
              className="inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
            >
              Open Visual Editor
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentSpots.map((spot) => (
              <div key={spot.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{spot.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {spotTypeLabels[spot.type] || spot.type}
                  </span>
                </div>
                {spot.description && (
                  <p className="text-sm text-gray-500 mb-2">{spot.description}</p>
                )}
                <div className="text-xs text-gray-400 mb-3">
                  <div className="truncate">Selector: {spot.selector}</div>
                  <div className="truncate">Page: {spot.pageUrl}</div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleDelete(spot.id)}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

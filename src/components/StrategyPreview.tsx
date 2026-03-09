import { useState } from 'react';
import type { CampaignDraft } from '../stores/appStore';

interface StrategyPreviewProps {
  campaignDraft?: CampaignDraft | null;
  onCreateCampaign: () => void;
}

const defaultAudiences = [
  { id: '1', name: 'New Visitors/Browsers', hasLink: true },
  { id: '2', name: 'Lapsed/One-Time Buyers', hasLink: true },
  { id: '3', name: 'Loyal/High-Value Customers', hasLink: true },
];

const defaultSpots = {
  'Homepage': ['Herobanner (1080x1080)', 'Product Box (400x300)', 'Skyscraper (72x300)'],
  'Product Page': ['Skyscraper (72x300)'],
  'Checkout Page': ['Product Box (400x300)'],
};

const messagingTabs = ['New Visitor', 'Lapsed Customer', 'Loyalty Member'];
const spotTabs = ['Hero Banner', 'Product Box', 'Skyscraper'];

const damImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop',
];

// Asset example variations for the "Generate New Asset Examples" button
const assetExamples = [
  {
    heroImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    greeting: 'Hi {{first_name}},',
    line1: 'Thanks for being a',
    line2: '{{member.status}}, Enjoy',
    line3: '{{15%}} off all your purchases,',
    line4: 'earn {{2x}} points',
    cta: 'Visit Our {{city}} Location',
    ctaColor: 'bg-amber-500',
  },
  {
    heroImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=400&fit=crop',
    greeting: 'Welcome back, {{first_name}}!',
    line1: 'Your VIP access is here.',
    line2: 'Black Friday Early Access:',
    line3: '{{25%}} off sitewide',
    line4: '+ Free Express Shipping',
    cta: 'Shop VIP Deals Now',
    ctaColor: 'bg-rose-500',
  },
  {
    heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
    greeting: 'Hey {{first_name}}!',
    line1: 'Your favorites are',
    line2: 'on sale! Get {{30%}} off',
    line3: 'items in your wishlist',
    line4: 'for the next 24 hours',
    cta: 'View My Wishlist Deals',
    ctaColor: 'bg-purple-500',
  },
  {
    heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop',
    greeting: '{{first_name}}, don\'t miss out!',
    line1: 'Based on your style,',
    line2: 'we picked these just for you.',
    line3: 'Exclusive {{20%}} off',
    line4: 'curated selections',
    cta: 'Shop My Picks',
    ctaColor: 'bg-teal-500',
  },
  {
    heroImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=400&fit=crop',
    greeting: 'Flash Sale, {{first_name}}!',
    line1: 'Only {{2}} hours left!',
    line2: 'Extra {{40%}} off',
    line3: 'all clearance items',
    line4: 'while supplies last',
    cta: 'Shop Flash Sale',
    ctaColor: 'bg-red-500',
  },
];

const researchItems = [
  {
    title: 'Research Black Friday web personalization strategies and athleisure market trends.',
    query: 'Search Black Friday web personalization strategies e-commerce, athleisure market trends Black Friday, personalization tactics for apparel ecommerce',
    sources: [
      { title: 'Black Friday Email Campaigns: 15 Examples for 2025 - Shopify', url: '#' },
      { title: '15 High-Converting Black Friday Email Examples (+Tips) - Retainful', url: '#' },
      { title: 'How to create a Black Friday ecommerce strategy - Hotlinger', url: '#' },
    ]
  },
  {
    title: 'Develop detailed campaign strategy document, including audience segmentation, personalization.',
    description: "I've gathered insights on Black Friday strategies, emphasizing personalized pop-ups and targeted offers, alongside athleisure market trends like early deals and online sales growth. Next, I'll refine these findings into a campaign framework.",
  },
  {
    title: 'Outline the technical implementation plan, including necessary tools, data points, and A/B testing framework.',
    description: "I've compiled initial research on Black Friday personalization tactics and athleisure trends into a campaign strategy draft, ready for further development.",
  },
  {
    title: 'Present the complete Black Friday web personalization campaign to the user.',
    description: "I've completed initial research on personalization tactics and athleisure trends and added the technical implementation and A/B testing details to the campaign strategy. Next, I'll review or expand the strategy.",
  },
];

const defaultOverview = `The primary goal of the Treasure Apparel Black Friday Web Personalization Campaign is to maximize revenue and customer lifetime value (CLV) by delivering highly relevant, individualized shopping experiences. By leveraging customer data to tailor the on-site journey, we aim to increase conversion rates, boost Average Order Value (AOV), and foster stronger brand loyalty.

This Black Friday web personalization campaign is designed to move beyond a one-size-fits-all discount strategy. By implementing sophisticated segmentation and dynamic content delivery, Treasure Apparel can create a hyper-relevant shopping experience that maximizes revenue, reinforces customer loyalty, and sets a new standard for personalized e-commerce in the athleisure space.`;

const defaultConclusion = `The primary goal of the Treasure Apparel Black Friday Web Personalization Campaign is to maximize revenue and customer lifetime value (CLV) by delivering highly relevant, individualized shopping experiences. By leveraging customer data to tailor the on-site journey, we aim to increase conversion rates, boost Average Order Value (AOV), and foster stronger brand loyalty.

This Black Friday web personalization campaign is designed to move beyond a one-size-fits-all discount strategy. By implementing sophisticated segmentation and dynamic content delivery, Treasure Apparel can create a hyper-relevant shopping experience that maximizes revenue, reinforces customer loyalty, and sets a new standard for personalized e-commerce in the athleisure space.

Please review and let me know if you have any questions or require further details.`;

export default function StrategyPreview({ campaignDraft, onCreateCampaign }: StrategyPreviewProps) {
  const [selectedPage, setSelectedPage] = useState('Homepage');
  const [selectedAudienceTab, setSelectedAudienceTab] = useState('New Visitor');
  const [selectedSpotTab, setSelectedSpotTab] = useState('Hero Banner');
  const [showReasoning, setShowReasoning] = useState(false);
  const [expandedResearch, setExpandedResearch] = useState<number | null>(0);
  const [assetExampleIndex, setAssetExampleIndex] = useState(0);

  const currentAsset = assetExamples[assetExampleIndex];

  const handleGenerateNewAsset = () => {
    setAssetExampleIndex((prev) => (prev + 1) % assetExamples.length);
  };

  // Derive dynamic data from campaignDraft with fallbacks
  const overviewText = campaignDraft?.overview || defaultOverview;
  const conclusionText = campaignDraft?.conclusion || defaultConclusion;
  const audiencesList = campaignDraft?.audiences || defaultAudiences.map((a) => ({ name: a.name }));
  const goalDesc = campaignDraft?.goalDescription || 'Increase Conversion Rate';
  const goalMet = campaignDraft?.goalMetric || '+15% over non-personalized sessions.';
  const audienceSegments = campaignDraft?.audienceSegments;
  const contentVariants = campaignDraft?.contentVariants;
  const contentSpots = campaignDraft?.contentSpots;
  const duration = campaignDraft?.duration;
  const primaryGoal = campaignDraft?.primaryGoal;
  const kpi = campaignDraft?.kpi;

  // Build spots object from contentSpots or use defaults
  const spotsData: Record<string, string[]> = contentSpots
    ? Object.fromEntries(contentSpots.map((cs) => [cs.page, cs.spots]))
    : defaultSpots;

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="py-6 px-20 space-y-4">
        {/* Campaign Overview */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Campaign Overview</h2>
          {overviewText.split('\n\n').map((para, idx) => (
            <p key={idx} className={`text-sm text-gray-600 leading-relaxed ${idx > 0 ? 'mt-3' : ''}`}>
              {para}
            </p>
          ))}
          {/* Duration / Primary Goal / KPI row */}
          {(duration || primaryGoal || kpi) && (
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              {duration && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="text-sm text-gray-700 font-medium">{duration}</p>
                </div>
              )}
              {primaryGoal && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Primary Goal</p>
                  <p className="text-sm text-gray-700 font-medium">{primaryGoal}</p>
                </div>
              )}
              {kpi && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">KPI</p>
                  <p className="text-sm text-gray-700 font-medium">{kpi}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Audience Segmentation (dynamic, shown when draft has segments) */}
        {audienceSegments && audienceSegments.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Audience Segmentation</h2>
            <div className="space-y-4">
              {audienceSegments.map((seg, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-900">{seg.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      seg.priority === 'Primary'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {seg.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {seg.targetingRules.map((rule, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2 text-xs">
                        <span className="text-gray-400 whitespace-nowrap">{rule.rule}:</span>
                        <span className="text-gray-600">{rule.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Personalization Example */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Personalization Example</h2>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>View Homepage as</span>
              <span className="text-blue-600 font-medium">Loyal/High-Value Customers</span>
            </div>
            <button
              onClick={handleGenerateNewAsset}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Generate New Asset Examples
            </button>
          </div>

          {/* Browser mockup */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md">
            {/* Browser chrome */}
            <div className="bg-gray-100 px-4 py-2 flex items-center gap-3 border-b border-gray-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white px-4 py-1 rounded-md text-xs text-gray-500 min-w-[200px] text-center flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Website preview */}
            <div className="bg-white">
              {/* Nav */}
              <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-6">
                  <span className="font-medium text-gray-900 text-sm">TREASURE</span>
                  <nav className="flex items-center gap-4 text-xs text-gray-600">
                    <span>New Arrivals</span>
                    <span>Shop</span>
                    <span>Sale</span>
                    <span>Our Story</span>
                  </nav>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>

              {/* Homepage Content */}
              {selectedPage === 'Homepage' && (
                <>
                  {/* Hero */}
                  <div className="relative">
                    <img
                      src={currentAsset.heroImage}
                      alt="Hero"
                      className="w-full h-48 object-cover transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                      <div className="px-8 text-white">
                        <p className="text-lg font-light mb-1">{currentAsset.greeting}</p>
                        <p className="text-sm mb-1">{currentAsset.line1}</p>
                        <p className="text-sm mb-1">{currentAsset.line2}</p>
                        <p className="text-sm mb-2">{currentAsset.line3}</p>
                        <p className="text-sm mb-3">{currentAsset.line4}</p>
                        <button className={`px-4 py-2 ${currentAsset.ctaColor} text-white text-xs rounded transition-colors`}>
                          {currentAsset.cta}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Product section */}
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Find Your Signature Look</h3>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-24 h-32 bg-amber-100 rounded-lg" />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Product Page Content */}
              {selectedPage === 'Product Page' && (
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="w-48 h-56 bg-amber-100 rounded-lg flex-shrink-0" />

                    {/* Product Details */}
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Athleisure Collection</p>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Flex Joggers</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-medium text-gray-900">$89.00</span>
                        <span className="text-sm text-gray-400 line-through">$120.00</span>
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">{'{{25%}} OFF'}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">Premium stretch fabric with moisture-wicking technology.</p>
                      <button className={`px-4 py-2 ${currentAsset.ctaColor} text-white text-xs rounded`}>
                        Add to Cart
                      </button>
                    </div>
                  </div>

                  {/* Personalized Recommendations */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">{'{{first_name}}, you might also like'}</h4>
                      <span className="text-xs text-amber-600">Based on your style</span>
                    </div>
                    <div className="flex gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1">
                          <div className="w-full h-20 bg-amber-50 rounded-lg mb-2" />
                          <p className="text-xs text-gray-700 truncate">Recommended Item {i}</p>
                          <p className="text-xs text-gray-500">$79.00</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Checkout Page Content */}
              {selectedPage === 'Checkout Page' && (
                <div className="p-6">
                  {/* Order Summary */}
                  <div className="flex gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-20 bg-amber-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Performance Flex Joggers</p>
                      <p className="text-xs text-gray-500">Size: M | Color: Black</p>
                      <p className="text-sm text-gray-900 mt-1">$89.00</p>
                    </div>
                  </div>

                  {/* Personalized Upsell */}
                  <div className="bg-amber-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-14 bg-amber-200 rounded flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-amber-700 font-medium mb-1">{'{{first_name}}, complete your look!'}</p>
                        <p className="text-xs text-gray-700">Matching Performance Tee</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-gray-900">$45.00</span>
                          <span className="text-xs text-gray-400 line-through">$60.00</span>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded">
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Checkout Summary */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">$89.00</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>{'{{member.status}}'} Discount ({'{{15%}}'})</span>
                      <span>-$13.35</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">$75.65</span>
                    </div>
                  </div>

                  <button className={`w-full mt-4 px-4 py-2.5 ${currentAsset.ctaColor} text-white text-sm font-medium rounded`}>
                    Complete Purchase
                  </button>
                </div>
              )}
            </div>

            {/* Page tabs */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-center gap-2 border-t border-gray-200">
              {['Homepage', 'Product Page', 'Checkout Page'].map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setSelectedPage(page)}
                  className={`px-4 py-1.5 text-xs rounded-full cursor-pointer transition-colors ${
                    selectedPage === page
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Audiences & Campaign Goal */}
        <div className="grid grid-cols-2 gap-4">
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Audiences</h2>
            <div className="space-y-2">
              {audiencesList.map((audience, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{idx + 1}.</span>
                  <a href="#" className="text-blue-600 hover:underline flex items-center gap-1">
                    {audience.name}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Campaign Goal</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">{goalDesc}</span>
                <span className="text-sm text-gray-400">{goalMet}</span>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Event</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option>purchase</option>
                  <option>add_to_cart</option>
                  <option>signup</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Creative Strategy */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Creative Strategy</h2>

          {/* Content Spots */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Content Spots</h3>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(spotsData).map(([page, sizes]) => (
                <div key={page}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{page}</h4>
                  <div className="space-y-1">
                    {sizes.map((size) => (
                      <p key={size} className="text-xs text-gray-500">{size}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Variants (dynamic) */}
          {contentVariants && contentVariants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Content Variants</h3>
              <div className="grid grid-cols-2 gap-4">
                {contentVariants.map((variant, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">{variant.name}</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Headline</p>
                        <p className="text-sm text-gray-700">{variant.headline}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Body</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{variant.body}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">CTA</p>
                        <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs rounded">
                          {variant.cta}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messaging */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Messaging</h3>

            {/* Audience tabs */}
            <div className="flex items-center gap-4 mb-4 border-b border-gray-200">
              {messagingTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedAudienceTab(tab)}
                  className={`pb-2 text-sm ${
                    selectedAudienceTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-900 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button className="pb-2 text-gray-400">+</button>
            </div>

            {/* Spot tabs */}
            <div className="flex items-center gap-4 mb-4">
              {spotTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedSpotTab(tab)}
                  className={`px-3 py-1 text-xs rounded ${
                    selectedSpotTab === tab
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button className="text-gray-400 text-xs">+</button>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <p>Hi {'{{first_name}}'},</p>
                  <p>Thanks for being a {'{{loyalty.member.status}}'}, Enjoy 15% off all your purchases, earn {'{{2x}}'} points</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call to action</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                  Visit our {'{{store.location}}'} Location
                </div>
              </div>
            </div>
          </div>

          {/* Creative */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Creative</h3>
            <p className="text-sm text-gray-600 mb-3">Autumn outdoor scenes with warm fall clothing</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">Images sourced DAM integration:</span>
              <span className="flex items-center gap-1 text-xs text-teal-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                bynder
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {['Urban Professional', 'Next Best Product', 'Age', 'Gender'].map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {damImages.map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
              ))}
              <span className="text-xs text-gray-400 ml-2">+33 more</span>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Conclusion</h2>
          {conclusionText.split('\n\n').map((para, idx) => (
            <p key={idx} className={`text-sm text-gray-600 leading-relaxed ${idx > 0 ? 'mt-3' : ''}`}>
              {para}
            </p>
          ))}
        </section>

        {/* Show Reasoning */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <span>Show Reasoning</span>
            <svg className={`w-4 h-4 transition-transform ${showReasoning ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showReasoning && (
            <div className="mt-4 space-y-3">
              {researchItems.map((item, idx) => (
                <div key={idx} className="border-l-2 border-amber-400 pl-4">
                  <button
                    onClick={() => setExpandedResearch(expandedResearch === idx ? null : idx)}
                    className="flex items-start gap-2 text-sm text-gray-700 w-full text-left"
                  >
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{item.title}</span>
                    <svg className={`w-4 h-4 ml-auto transition-transform ${expandedResearch === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedResearch === idx && (
                    <div className="mt-2 ml-6 text-xs text-gray-500">
                      {item.query && <p className="italic mb-2">{item.query}</p>}
                      {item.sources && (
                        <ul className="space-y-1">
                          {item.sources.map((source, sIdx) => (
                            <li key={sIdx}>
                              <a href={source.url} className="text-blue-600 hover:underline flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                {source.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.description && <p>{item.description}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Would you like to proceed with the presented strategy?</p>
          <button
            onClick={onCreateCampaign}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

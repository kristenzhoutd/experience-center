import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plane, Landmark, Gamepad2, Film } from 'lucide-react';
import { Button } from '@/design-system';
import { useMarketingLabStore } from '../stores/marketingLabStore';

const rotatingWords = [
  { word: 'amazing', color: '#F7A761', icon: '/icons/rotating-word-1.svg' },
  { word: 'brilliant', color: '#A9D156', icon: '/icons/rotating-word-2.svg' },
  { word: 'revolutionary', color: '#6961AE', icon: '/icons/rotating-word-3.svg' },
  { word: 'exceptional', color: '#F05256', icon: '/icons/rotating-word-4.svg' },
];

const industries = [
  { id: 'retail', label: 'Retail', description: 'E-commerce, brick-and-mortar, and omnichannel retail brands', icon: ShoppingBag },
  { id: 'travel', label: 'Travel & Hospitality', description: 'Airlines, hotels, OTAs, and travel experience providers', icon: Plane },
  { id: 'financial', label: 'Financial Services', description: 'Banking, insurance, fintech, and wealth management', icon: Landmark },
  { id: 'gaming', label: 'Gaming', description: 'Mobile, console, and PC gaming studios and publishers', icon: Gamepad2 },
  { id: 'media', label: 'Media & Entertainment', description: 'Streaming, publishing, live events, and content platforms', icon: Film },
];

const useCases = [
  { id: 'campaign', label: 'Plan a Marketing Campaign', description: 'Design a full-funnel campaign with strategy, targeting, and channel allocation' },
  { id: 'segments', label: 'Discover Customer Segments', description: 'Identify and profile high-value audience segments for precision targeting' },
  { id: 'journey', label: 'Build a Lifecycle Journey', description: 'Map the customer journey from acquisition through retention and advocacy' },
  { id: 'performance', label: 'Analyze Marketing Performance', description: 'Evaluate campaign effectiveness and uncover optimization opportunities' },
];

export default function AIMarketingLabPage() {
  const navigate = useNavigate();
  const { industry, useCase, setIndustry, setUseCase, resetSession, addChatMessage } = useMarketingLabStore();
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedUseCase, setSelectedUseCase] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    resetSession();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsAnimating(false);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentWord = rotatingWords[wordIndex];

  const handleIndustrySelect = (id: string) => {
    setSelectedIndustry(id);
    setIndustry(id);
    setSelectedUseCase('');
    setUseCase('');
  };

  const handleUseCaseSelect = (id: string) => {
    setSelectedUseCase(id);
    setUseCase(id);
  };

  const handleStart = () => {
    const industryLabel = industries.find(i => i.id === selectedIndustry)?.label || selectedIndustry;
    const useCaseLabel = useCases.find(u => u.id === selectedUseCase)?.label || selectedUseCase;

    addChatMessage({
      id: `ai-welcome-${Date.now()}`,
      role: 'ai',
      content: `Welcome! Let's build a ${useCaseLabel.toLowerCase()} for the ${industryLabel} industry. First, what's your primary marketing objective?`,
      options: ['Increase Awareness', 'Drive Conversions', 'Boost Retention', 'Launch New Product'],
      stepKey: 'objective',
    });

    navigate('/ai-marketing-lab/workflow');
  };

  return (
    <div className="h-full overflow-y-auto flex items-center justify-center">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Let's launch something
          </h1>
          <div className="flex items-center justify-center gap-2 text-4xl font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <span
              className="inline-flex items-center gap-2 transition-all duration-400"
              style={{
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
              }}
            >
              <img src={currentWord.icon} alt="" className="w-9 h-9" />
              <span style={{ color: currentWord.color }}>{currentWord.word}</span>
            </span>
          </div>
        </div>

        {/* Step 1: Industry Selection */}
        {!selectedIndustry ? (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Choose your industry</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {industries.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleIndustrySelect(item.id)}
                    className="border border-gray-200 rounded-2xl p-5 cursor-pointer transition-all text-left hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <Icon className="w-6 h-6 mb-3 text-gray-400" />
                    <div className="font-medium text-gray-900 mb-1">{item.label}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{item.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            {(() => {
              const selected = industries.find(i => i.id === selectedIndustry);
              if (!selected) return null;
              const Icon = selected.icon;
              return (
                <button
                  onClick={() => { setSelectedIndustry(''); setIndustry(''); setSelectedUseCase(''); setUseCase(''); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-sm text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                  {selected.label}
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              );
            })()}
          </div>
        )}

        {/* Step 2: Use Case Selection */}
        {selectedIndustry && !selectedUseCase && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">What would you like to do?</h2>
            <div className="grid grid-cols-2 gap-4">
              {useCases.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleUseCaseSelect(item.id)}
                  className="border border-gray-200 rounded-2xl p-5 cursor-pointer transition-all text-left hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="font-medium text-gray-900 mb-1">{item.label}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{item.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedIndustry && selectedUseCase && (
          <div className="mb-6">
            <button
              onClick={() => { setSelectedUseCase(''); setUseCase(''); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-sm text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {useCases.find(u => u.id === selectedUseCase)?.label}
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Start Button */}
        {selectedIndustry && selectedUseCase && (
          <div className="text-center">
            <Button variant="primary" onClick={handleStart}>
              Start Experience
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

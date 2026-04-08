import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, Shield, Lightbulb } from 'lucide-react';
import { Button } from '@/design-system';
import ApiKeySetupModal, { isApiKeyConfigured } from '../components/ApiKeySetupModal';
import BookWalkthroughModal from '../components/BookWalkthroughModal';
import { useExperienceLabStore } from '../stores/experienceLabStore';
import { goals } from '../data/experienceLabConfig';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const goalIcons: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  'shield': Shield,
  'lightbulb': Lightbulb,
};

const rotatingWords = [
  { word: 'growth', color: '#F7A761', icon: '/icons/rotating-word-1.svg' },
  { word: 'performance', color: '#A9D156', icon: '/icons/rotating-word-2.svg' },
  { word: 'activation', color: '#6961AE', icon: '/icons/rotating-word-3.svg' },
  { word: 'retention', color: '#F05256', icon: '/icons/rotating-word-4.svg' },
];

export default function ExperienceCenterPage() {
  const navigate = useNavigate();
  const { setGoal, resetSession } = useExperienceLabStore();
  const [selectedGoal, setSelectedGoal] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    resetSession();
    if (!isApiKeyConfigured()) {
      setShowApiKeyModal(true);
    }
  }, []);

  // Listen for open-api-key-modal event from nav bar
  useEffect(() => {
    const handler = () => setShowApiKeyModal(true);
    window.addEventListener('open-api-key-modal', handler);
    return () => window.removeEventListener('open-api-key-modal', handler);
  }, []);

  // Listen for booking modal event from nav bar
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  useEffect(() => {
    const handler = () => setShowBookingModal(true);
    window.addEventListener('open-booking-modal', handler);
    return () => window.removeEventListener('open-booking-modal', handler);
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

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
    const goalLabel = goals.find(g => g.id === goalId)?.label || goalId;
    trackEvent(AnalyticsEvents.GOAL_SELECT, { goal_id: goalId, goal_label: goalLabel });
  };

  const handleStart = () => {
    if (!selectedGoal) return;
    const goalLabel = goals.find(g => g.id === selectedGoal)?.label || selectedGoal;
    trackEvent(AnalyticsEvents.EXPERIENCE_START, { goal_id: selectedGoal, goal_label: goalLabel });
    setGoal(selectedGoal);
    navigate('/experience-center/workflow');
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center px-4 md:px-0">
      <div className="flex-1 min-h-8" />
      <div className="w-full max-w-4xl mx-auto px-2 md:px-6">
        {/* Hero */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-light text-gray-900 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Experience AI marketing that drives
          </h1>
          <div className="flex items-center justify-center gap-2 text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <span
              className="inline-flex items-center gap-2 transition-all duration-400"
              style={{
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? 'translateY(8px)' : 'translateY(0)',
              }}
            >
              <img src={currentWord.icon} alt="" className="w-7 h-7 md:w-9 md:h-9" />
              <span style={{ color: currentWord.color }}>{currentWord.word}</span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4 mb-0 max-w-lg mx-auto leading-relaxed px-4">
            Explore a curated AI experience designed for enterprise brands - from audience analysis to journeys, campaigns, and next-best actions.
          </p>
        </div>
      </div>

      {/* Goal Selection — Auto-scrolling carousel */}
      <GoalCarousel
        selectedGoal={selectedGoal}
        onSelect={handleGoalSelect}
      />

      {/* Start Button */}
      <div className={`text-center mt-6 md:mt-8 transition-opacity duration-300 ${selectedGoal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Button variant="primary" onClick={handleStart}>
          Start guided experience
        </Button>
      </div>

      {/* Spacer to push footer down */}
      <div className="flex-1 min-h-8" />

      {/* Trust strip — footer */}
      <div className="text-center py-4 pb-6 px-4 w-full">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-[11px] text-gray-600">
          <span>Guided for exploration</span>
          <span className="hidden md:block w-1 h-1 rounded-full bg-gray-500" />
          <span>Powered by sandbox customer signals</span>
          <span className="hidden md:block w-1 h-1 rounded-full bg-gray-500" />
          <span>AI-generated for human review</span>
          <span className="hidden md:block w-1 h-1 rounded-full bg-gray-500" />
          <button onClick={() => setShowLegalModal(true)} className="underline hover:text-gray-900 cursor-pointer">Legal Notice</button>
        </div>
      </div>

      {/* Legal Notice Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div onClick={() => setShowLegalModal(false)} className="fixed inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Legal Notice</h2>
              <button onClick={() => setShowLegalModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              This interactive experience is a simulated demonstration of Treasure AI products and services. This demo uses synthetic data and simplified scenarios for illustration only. It does not guarantee or represent actual product performance, configuration, or results, which will vary based on various factors, including but not limited to your data and implementation. The features, workflows, outputs, and user interface in this demo may differ from the commercially available product. Do not rely on this demo for business, financial, legal, or compliance decisions. Use of this demo is subject to our <a href="https://www.treasuredata.com/terms/website-terms-of-use/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Website Terms of Use</a> and <a href="https://www.treasuredata.com/privacy-statement/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">Privacy Statement</a>, as updated from time to time.
            </p>
          </div>
        </div>
      )}

      <ApiKeySetupModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      <BookWalkthroughModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
    </div>
  );
}

// ============================================================
// Goal Carousel (auto-scroll, matches AI Suite homepage pattern)
// ============================================================
function GoalCarousel({
  selectedGoal,
  onSelect,
}: {
  selectedGoal: string;
  onSelect: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = goals;

  return (
    <div className="w-full max-w-2xl -mt-3 px-4">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {items.map((g, index) => {
          const Icon = goalIcons[g.icon] || TrendingUp;
          const isSelected = selectedGoal === g.id;
          return (
            <button
              key={`${g.id}-${index}`}
              onClick={() => onSelect(g.id)}
              className={`p-4 md:p-5 rounded-2xl text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border border-transparent backdrop-blur-sm bg-white/70 shadow-md'
                  : 'border border-white/60 backdrop-blur-sm bg-white/10 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] hover:bg-white/40 hover:shadow-[0_4px_8px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.06)]'
              }`}
            >
              <Icon className={`w-5 h-5 md:w-6 md:h-6 mb-2 md:mb-3 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`} strokeWidth={1.5} />
              <div className={`font-medium text-sm mb-1 text-gray-900`}>{g.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{g.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, Zap, Heart } from 'lucide-react';
import { Button } from '@/design-system';
import BookWalkthroughModal from '../components/BookWalkthroughModal';
import { useExperienceLabStore } from '../stores/experienceLabStore';
import { goals } from '../data/experienceLabConfig';

const goalIcons: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  'zap': Zap,
  'heart': Heart,
};

const rotatingWords = [
  { word: 'amazing', color: '#F7A761', icon: '/icons/rotating-word-1.svg' },
  { word: 'brilliant', color: '#A9D156', icon: '/icons/rotating-word-2.svg' },
  { word: 'revolutionary', color: '#6961AE', icon: '/icons/rotating-word-3.svg' },
  { word: 'exceptional', color: '#F05256', icon: '/icons/rotating-word-4.svg' },
];

export default function ExperienceCenterPage() {
  const navigate = useNavigate();
  const { setGoal, resetSession } = useExperienceLabStore();
  const [selectedGoal, setSelectedGoal] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    resetSession();
  }, []);

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
  };

  const handleStart = () => {
    if (!selectedGoal) return;
    setGoal(selectedGoal);
    navigate('/experience-center/workflow');
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col items-center px-4 md:px-0">
      <div className="flex-1" />
      <div className="w-full max-w-4xl mx-auto px-2 md:px-6">
        {/* Hero */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-light text-gray-900 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
            Let's launch something
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
          <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4 max-w-lg mx-auto leading-relaxed px-4">
            Explore a guided AI experience built for enterprise brands.
            No setup. No login. Just choose a goal and see the outcome.
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
      <div className="flex-1" />

      {/* Trust strip — footer */}
      <div className="text-center py-4 pb-8 px-4 w-full">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-[11px] text-gray-600">
          <span>Powered by contextual customer intelligence</span>
          <span className="hidden md:block w-1 h-1 rounded-full bg-gray-500" />
          <span>AI-generated for human review</span>
          <span className="hidden md:block w-1 h-1 rounded-full bg-gray-500" />
          <span>Built on trusted, traceable context</span>
        </div>
      </div>

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
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    let animationFrame: number;
    const scrollSpeed = 0.5;

    const step = () => {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += scrollSpeed;
      }
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPaused]);

  // Duplicate for seamless loop
  const items = [...goals, ...goals];

  return (
    <div
      className="w-full max-w-5xl mt-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
      }}
    >
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 px-2"
        style={{ scrollBehavior: 'auto' }}
      >
        {items.map((g, index) => {
          const Icon = goalIcons[g.icon] || TrendingUp;
          const isSelected = selectedGoal === g.id;
          return (
            <button
              key={`${g.id}-${index}`}
              onClick={() => onSelect(g.id)}
              className={`flex-shrink-0 w-60 md:w-72 p-4 md:p-5 rounded-2xl text-left transition-all cursor-pointer ${
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

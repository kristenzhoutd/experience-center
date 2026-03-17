import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, Zap, Heart, ArrowRight, FileText, Users, GitBranch, LineChart } from 'lucide-react';
import { Button } from '@/design-system';
import { useExperienceLabStore } from '../stores/experienceLabStore';
import { goals, previewCards } from '../data/experienceLabConfig';

const goalIcons: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  'zap': Zap,
  'heart': Heart,
};

const previewIcons: Record<string, React.ElementType> = {
  brief: FileText,
  segments: Users,
  journey: GitBranch,
  performance: LineChart,
};

const rotatingWords = [
  { word: 'amazing', color: '#F7A761', icon: '/icons/rotating-word-1.svg' },
  { word: 'brilliant', color: '#A9D156', icon: '/icons/rotating-word-2.svg' },
  { word: 'revolutionary', color: '#6961AE', icon: '/icons/rotating-word-3.svg' },
  { word: 'exceptional', color: '#F05256', icon: '/icons/rotating-word-4.svg' },
];

export default function AIMarketingLabPage() {
  const navigate = useNavigate();
  const { setGoal, resetSession } = useExperienceLabStore();
  const [selectedGoal, setSelectedGoal] = useState('');
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

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  const handleStart = () => {
    if (!selectedGoal) return;
    setGoal(selectedGoal);
    navigate('/ai-marketing-lab/workflow');
  };

  return (
    <div className="h-full overflow-y-auto flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero — original styling preserved */}
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
          <p className="text-sm text-gray-500 mt-4 max-w-lg mx-auto leading-relaxed">
            Explore a guided AI experience built for enterprise brands.
            No setup. No login. Just choose a goal and see the outcome.
          </p>
        </div>

        {/* Goal Selection Cards */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">What would you like to achieve?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {goals.map((g) => {
              const Icon = goalIcons[g.icon] || TrendingUp;
              const isSelected = selectedGoal === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => handleGoalSelect(g.id)}
                  className={`relative border rounded-2xl p-5 cursor-pointer transition-all text-left ${
                    isSelected
                      ? 'border-blue-400 bg-blue-50/80 shadow-md'
                      : 'border-gray-200 bg-white/60 backdrop-blur-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className={`font-medium text-gray-900 mb-1 ${isSelected ? 'text-blue-900' : ''}`}>{g.label}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{g.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        {selectedGoal && (
          <div className="text-center mb-12">
            <Button variant="primary" onClick={handleStart}>
              Start guided experience
            </Button>
          </div>
        )}

        {/* Sample Output Previews */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">See what you'll get</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {previewCards.map((card) => {
              const Icon = previewIcons[card.id] || FileText;
              return (
                <div
                  key={card.id}
                  className="bg-white/50 backdrop-blur-sm border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">{card.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    {card.lines.map((line, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="text-[11px] text-gray-400">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust strip */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-6 text-[11px] text-gray-400">
            <span>Powered by contextual customer intelligence</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>AI-generated for human review</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Built on trusted, traceable context</span>
          </div>
        </div>
      </div>
    </div>
  );
}

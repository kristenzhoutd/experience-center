import { useState, useCallback } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';

const STEPS = [
  {
    question: 'Welcome! What industry are you in?',
    key: 'industry' as const,
    multi: false,
    options: ['E-commerce', 'SaaS / B2B', 'Finance', 'Healthcare', 'Retail', 'Media & Entertainment', 'Other'],
  },
  {
    question: "What's your role?",
    key: 'role' as const,
    multi: false,
    options: ['Marketing Manager', 'Performance Marketer', 'Media Buyer', 'CMO / VP Marketing', 'Analyst', 'Other'],
  },
  {
    question: 'What are your primary goals?',
    key: 'goals' as const,
    multi: true,
    options: ['Budget optimization', 'Creative performance', 'Audience targeting', 'Cross-channel insights', 'Reporting & analytics'],
  },
  {
    question: 'What metrics matter most to you?',
    key: 'keyMetrics' as const,
    multi: true,
    options: ['ROAS', 'CPA', 'CTR', 'Conversions', 'Impressions', 'Budget pacing'],
  },
];

const TOTAL_STEPS = STEPS.length + 1; // +1 for completion screen

export default function PaidMediaOnboarding() {
  const { currentStep, profile, setStep, updateProfile, completeOnboarding } = useOnboardingStore();
  const [multiSelections, setMultiSelections] = useState<string[]>([]);

  const handleSingleSelect = useCallback((key: string, value: string) => {
    updateProfile({ [key]: value });
    setStep(currentStep + 1);
  }, [currentStep, updateProfile, setStep]);

  const handleMultiToggle = useCallback((value: string) => {
    setMultiSelections(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }, []);

  const handleMultiContinue = useCallback(() => {
    if (multiSelections.length === 0) return;
    const step = STEPS[currentStep];
    updateProfile({ [step.key]: multiSelections });
    setMultiSelections([]);
    setStep(currentStep + 1);
  }, [currentStep, multiSelections, updateProfile, setStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
      setMultiSelections([]);
    }
  }, [currentStep, setStep]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleFinish = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const isCompletionStep = currentStep >= STEPS.length;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <img src="/td-icon.svg" alt="Treasure Data" className="w-6 h-6" />
          <span className="text-sm font-semibold text-gray-900">Getting Started</span>
        </div>
        {!isCompletionStep && (
          <button
            onClick={handleSkip}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-none"
          >
            Skip
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 px-8 py-3">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'w-6 h-2 bg-gray-900'
                : i < currentStep
                  ? 'w-2 h-2 bg-gray-900'
                  : 'w-2 h-2 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col justify-between px-8 py-6">
        {!isCompletionStep ? (
          <>
            {/* Question */}
            <div>
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 cursor-pointer bg-transparent border-none transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              )}
              <h2 className="text-lg text-gray-900 font-normal leading-relaxed">
                {STEPS[currentStep].question}
              </h2>
              {STEPS[currentStep].multi && (
                <p className="text-xs text-gray-400 mt-1">Select all that apply</p>
              )}
            </div>

            {/* Options */}
            <div className="pb-8">
              <div className="flex flex-wrap gap-2">
                {STEPS[currentStep].options.map((option) => {
                  const isMulti = STEPS[currentStep].multi;
                  const isSelected = isMulti && multiSelections.includes(option);

                  return (
                    <button
                      key={option}
                      onClick={() =>
                        isMulti
                          ? handleMultiToggle(option)
                          : handleSingleSelect(STEPS[currentStep].key, option)
                      }
                      className={`px-4 py-2 rounded-full text-sm transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {STEPS[currentStep].multi && (
                <button
                  onClick={handleMultiContinue}
                  disabled={multiSelections.length === 0}
                  className={`mt-5 px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border-none ${
                    multiSelections.length > 0
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              )}
            </div>
          </>
        ) : (
          /* Completion screen */
          <>
            <div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg text-gray-900 font-semibold mb-2">You're all set!</h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                We'll tailor your dashboard and insights based on your preferences. You can always update these in settings.
              </p>

              {profile && (
                <div className="mt-6 space-y-3">
                  {profile.industry && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20">Industry</span>
                      <span className="text-xs font-medium text-gray-700 px-2.5 py-1 bg-gray-50 rounded-full">{profile.industry}</span>
                    </div>
                  )}
                  {profile.role && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20">Role</span>
                      <span className="text-xs font-medium text-gray-700 px-2.5 py-1 bg-gray-50 rounded-full">{profile.role}</span>
                    </div>
                  )}
                  {profile.goals && profile.goals.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 w-20 pt-1">Goals</span>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.goals.map(g => (
                          <span key={g} className="text-xs font-medium text-gray-700 px-2.5 py-1 bg-gray-50 rounded-full">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.keyMetrics && profile.keyMetrics.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 w-20 pt-1">Metrics</span>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.keyMetrics.map(m => (
                          <span key={m} className="text-xs font-medium text-gray-700 px-2.5 py-1 bg-gray-50 rounded-full">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pb-8">
              <button
                onClick={handleFinish}
                className="px-8 py-2.5 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer border-none"
              >
                Get Started
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * PlanGenerationLoading — Loading animation shown while AI generates campaign plans.
 * 3-card step visualization matching Figma design (node 6187:238982).
 */

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Understanding your campaign brief',
    description: 'Analyzing your goals, target audience, budget constraints, and key performance indicators to build a comprehensive blueprint.',
    visualType: 'progress-bars' as const,
  },
  {
    id: 2,
    title: 'Compiling a campaign plan',
    description: 'Researching market trends, competitor strategies, and best practices to create a data-driven campaign strategy.',
    visualType: 'data-viz' as const,
  },
  {
    id: 3,
    title: 'Pulling data together and displaying findings',
    description: 'Synthesizing requirements and research to generate a customized campaign plan recommendation with clear action steps.',
    visualType: 'chart' as const,
  },
];

export default function PlanGenerationLoading() {
  const [activeStep, setActiveStep] = useState(0);
  const [showNotify, setShowNotify] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setActiveStep(1), 800),
      setTimeout(() => setActiveStep(2), 4000),
      setTimeout(() => setShowNotify(true), 1500),
      setTimeout(() => setActiveStep(3), 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FB] overflow-hidden relative">
      {/* Inline keyframes */}
      <style>{`
        @keyframes plg-fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes plg-grow-width { from { width: 0%; } to { width: var(--tw); } }
        @keyframes plg-grow-height { from { height: 4px; } to { height: var(--th); } }
        @keyframes plg-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes plg-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes plg-check-draw { 0% { stroke-dashoffset: 12; } 100% { stroke-dashoffset: 0; } }
        @keyframes plg-slide-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes plg-gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes plg-skeleton { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>

      {/* Step Cards */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="flex gap-6 max-w-[1100px] w-full">
          {STEPS.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              index={idx}
              isActive={activeStep >= idx + 1}
              isCompleted={activeStep > idx + 1}
            />
          ))}
        </div>
      </div>

      {/* Notify Banner */}
      {showNotify && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border border-[#EFF2F8] rounded-[10px] px-4 w-[448px] h-[86px] flex items-center gap-3 shadow-sm z-10"
          style={{ animation: 'plg-slide-up 0.5s ease-out both' }}
        >
          <div className="w-10 h-10 bg-[#DBEAFE] rounded-full flex items-center justify-center shrink-0">
            <Bell size={20} className="text-[#3B82F6]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#101828] leading-5 m-0">Get notified when complete</p>
            <p className="text-xs text-[#4A5565] leading-4 m-0">We&apos;ll let you know when your campaign plan is ready</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {notified ? (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">Notification set</span>
            ) : (
              <button
                onClick={() => setNotified(true)}
                className="px-3 py-1.5 text-xs font-medium text-[#212327] border border-[#878F9E] rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Notify me
              </button>
            )}
            <button
              onClick={() => setShowNotify(false)}
              className="text-[#9BA2AF] hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, index, isActive, isCompleted }: {
  step: typeof STEPS[number];
  index: number;
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <div
      className={`flex-1 bg-[#E8ECF3] rounded-[10px] p-4 flex flex-col gap-3 min-h-[303px] relative transition-all duration-500 ${
        isActive ? 'border border-[#C7D2FE] shadow-[0_0_0_1px_rgba(99,102,241,0.15)]' : 'border border-[#E5E7EB]'
      }`}
      style={{ animation: `plg-fade-in-up 0.5s ease-out ${index * 0.2}s both` }}
    >
      {/* Step Number */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-all duration-400 ${
          isCompleted ? 'bg-[#51A2FF] text-white' : 'bg-[#CBD1DB] text-[#0A0A0A]'
        }`}
      >
        {isCompleted ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 12, animation: 'plg-check-draw 0.4s ease-out forwards' }} />
          </svg>
        ) : step.id}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-[#0A0A0A] leading-5 tracking-tight m-0">{step.title}</h3>

      {/* Description */}
      <p className="text-xs text-[#4A5565] leading-4 m-0">{step.description}</p>

      {/* Visualization Card */}
      <div
        className={`absolute bottom-4 left-4 right-4 h-[119px] bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] p-[17px] overflow-hidden transition-opacity duration-500 ${
          isActive ? 'opacity-100' : 'opacity-50'
        }`}
      >
        {step.visualType === 'progress-bars' && <ProgressBarsViz isActive={isActive} isCompleted={isCompleted} />}
        {step.visualType === 'data-viz' && <DataViz isActive={isActive} />}
        {step.visualType === 'chart' && <ChartViz isActive={isActive} />}
      </div>
    </div>
  );
}

// Step 1: Progress bars with animated checkmarks
function ProgressBarsViz({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  const bars = [
    { targetWidth: 100, delay: 0.3, done: isCompleted || isActive },
    { targetWidth: 100, delay: 0.8, done: isCompleted },
    { targetWidth: 60, delay: 1.4, done: false },
    { targetWidth: 0, delay: 2.0, done: false },
  ];

  return (
    <div className="flex flex-col gap-2 h-full">
      {bars.map((bar, i) => {
        const showCheck = (i === 0 && isActive) || (i <= 1 && isCompleted);
        const showProgress = isActive && bar.targetWidth > 0;
        return (
          <div key={i} className="flex items-center gap-2 h-3.5">
            <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
              {showCheck ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ animation: `plg-slide-up 0.3s ease-out ${bar.delay}s both` }}>
                  <circle cx="7" cy="7" r="6" fill="#51A2FF" />
                  <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 12, animation: `plg-check-draw 0.4s ease-out ${bar.delay + 0.2}s both` }} />
                </svg>
              ) : (
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-[#D1D5DC]"
                  style={isActive && bar.targetWidth > 0 ? { animation: `plg-pulse 2s infinite ${bar.delay}s` } : undefined}
                />
              )}
            </div>
            <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
              {showProgress && (
                <div
                  className="h-full bg-[#51A2FF] rounded-full relative overflow-hidden"
                  style={{
                    '--tw': `${bar.targetWidth}%`,
                    animation: `plg-grow-width ${0.8 + i * 0.3}s ease-out ${bar.delay}s forwards`,
                    width: 0,
                  } as React.CSSProperties}
                >
                  <div
                    className="absolute top-0 left-0 w-1/2 h-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                      animation: `plg-shimmer 1.5s infinite ${bar.delay + 0.5}s`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Step 2: Data visualization with colored dots and mini bar chart
function DataViz({ isActive }: { isActive: boolean }) {
  const rows = [
    { color: '#51A2FF', w: 180, delay: 0.2 },
    { color: '#C27AFF', w: 150, delay: 0.5 },
    { color: '#FF8904', w: 130, delay: 0.8 },
  ];

  const chartBars = [
    { h: 16, color: '#8EC5FF', delay: 1.2 },
    { h: 24, color: '#DAB2FF', delay: 1.4 },
    { h: 20, color: '#FFB86A', delay: 1.6 },
    { h: 28, color: '#7BF1A8', delay: 1.8 },
  ];

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 h-[22px] pb-px border-b border-[#E5E7EB]"
        style={{ animation: 'plg-slide-up 0.3s ease-out both' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="#9CA3AF" strokeWidth="1.2" />
          <path d="M4 7H10" stroke="#9CA3AF" strokeWidth="1.2" />
        </svg>
        <div className="w-20 h-1.5 bg-[#D1D5DC] rounded-full"
          style={isActive ? { animation: 'plg-skeleton 1.5s infinite' } : undefined} />
      </div>

      {/* Data rows */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2 h-1.5"
            style={{ animation: `plg-slide-up 0.4s ease-out ${row.delay}s both` }}>
            <div className="w-1 h-1 rounded-full shrink-0"
              style={{
                backgroundColor: row.color,
                ...(isActive ? { animation: `plg-pulse 1.5s infinite ${row.delay + 0.3}s` } : {}),
              }} />
            <div className="h-1.5 rounded-full overflow-hidden bg-[#E5E7EB]" style={{ width: row.w }}>
              {isActive && (
                <div className="h-full rounded-full" style={{
                  '--tw': '100%',
                  backgroundColor: row.color,
                  opacity: 0.3,
                  width: 0,
                  animation: `plg-grow-width 1.5s ease-out ${row.delay + 0.3}s forwards`,
                } as React.CSSProperties} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="flex items-end gap-1 mt-auto">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ animation: 'plg-slide-up 0.3s ease-out 1s both' }}>
          <path d="M1 9L4 5L7 7L11 3" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <div className="flex items-end gap-0.5">
          {chartBars.map((bar, i) => (
            <div key={i} className="w-1 rounded-md" style={{
              '--th': `${bar.h}px`,
              backgroundColor: bar.color,
              height: 4,
              ...(isActive ? { animation: `plg-grow-height 0.6s ease-out ${bar.delay}s forwards` } : {}),
            } as React.CSSProperties} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 3: Gradient progress bar with skeleton lines
function ChartViz({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header + gradient bar */}
      <div className="flex items-center gap-2 h-4" style={{ animation: 'plg-slide-up 0.3s ease-out both' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="14" height="14" rx="3" stroke="#9CA3AF" strokeWidth="1.2" />
          <path d="M5 8H11M5 5.5H11M5 10.5H8" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          {isActive && (
            <div className="h-full rounded-full" style={{
              '--tw': '100%',
              background: 'linear-gradient(90deg, #FF8904, #C27AFF, #51A2FF)',
              backgroundSize: '200% 200%',
              opacity: 0.81,
              width: 0,
              animation: 'plg-grow-width 2s ease-out 0.3s forwards, plg-gradient-shift 3s ease infinite',
            } as React.CSSProperties} />
          )}
        </div>
      </div>

      {/* Skeleton lines */}
      <div className="flex flex-col gap-1.5 pl-6">
        {[170, 136, 127].map((w, i) => (
          <div key={i} className="h-1.5 bg-[#E5E7EB] rounded-full"
            style={{
              width: w,
              animation: `plg-slide-up 0.3s ease-out ${0.8 + i * 0.2}s both`,
            }}>
            {isActive && (
              <div className="w-full h-full bg-[#D1D5DC] rounded-full"
                style={{ animation: `plg-skeleton 1.5s infinite ${i * 0.3}s` }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

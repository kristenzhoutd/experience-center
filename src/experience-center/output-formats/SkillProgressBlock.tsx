/**
 * Skill Progress — inline progress steps displayed directly in the chat flow.
 */

import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

export interface ProgressStep {
  message: string;
  stage?: 'intent' | 'route' | 'skill_call' | 'skill_result' | 'ui_update';
}

interface SkillProgressBlockProps {
  steps: ProgressStep[];
  isActive: boolean;
}

const STAGE_BADGES: Record<string, { label: string; color: string }> = {
  intent: { label: 'Scenario', color: 'bg-blue-50 text-blue-600' },
  route: { label: 'Routing', color: 'bg-indigo-50 text-indigo-600' },
  skill_call: { label: 'Skill', color: 'bg-amber-50 text-amber-700' },
  skill_result: { label: 'Result', color: 'bg-emerald-50 text-emerald-700' },
  ui_update: { label: 'Done', color: 'bg-gray-100 text-gray-600' },
};

function ElapsedTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-[10px] text-gray-400 tabular-nums ml-auto flex-shrink-0 mt-1">
      {seconds}s
    </span>
  );
}

export default function SkillProgressBlock({ steps, isActive }: SkillProgressBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (ref.current && isActive) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [steps.length, isActive]);

  // Collapse when generation completes
  useEffect(() => {
    if (!isActive && steps.length > 0) {
      setIsExpanded(false);
    }
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive, steps.length]);

  if (steps.length === 0) return null;

  // Collapsed state — show a compact summary
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
      >
        <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
          <Check className="w-2.5 h-2.5" />
        </div>
        <span>Generated in {steps.length} steps</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div ref={ref}>
      {!isActive && (
        <button
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-2 py-1 mb-1 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span>Collapse</span>
        </button>
      )}
      <div className="space-y-0.5">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isRunning = isLast && isActive;
          const badge = step.stage ? STAGE_BADGES[step.stage] : null;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 py-1 transition-all duration-500"
            >
              <div className="w-5 flex items-center justify-center flex-shrink-0 mt-px">
                {isRunning ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${badge.color} flex-shrink-0 mt-px`}>
                  {badge.label}
                </span>
              )}
              <span className={`text-xs mt-0.5 ${isRunning ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {step.message}
              </span>
              {isRunning && <ElapsedTimer />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

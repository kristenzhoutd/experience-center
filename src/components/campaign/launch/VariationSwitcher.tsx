/**
 * Dropdown switcher that links to all 5 campaign launch route variations,
 * preserving location.state (blueprintId, campaignId, etc.) when switching.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const VARIATIONS = [
  { path: '/campaign-launch', label: 'Sidebar Accordion' },
  { path: '/campaign-launch/scroll', label: 'Default (Scroll)' },
  { path: '/campaign-launch/tabbed', label: 'Tabbed' },
  { path: '/campaign-launch/wizard', label: 'Wizard Stepper' },
  { path: '/campaign-launch/accordion', label: 'Accordion' },
  { path: '/campaign-launch/sticky-nav', label: 'Sticky Section Nav' },
  { path: '/campaign-launch/command', label: 'AI Command' },
] as const;

export default function VariationSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = VARIATIONS.find((v) => v.path === location.pathname) || VARIATIONS[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-[#E8ECF3] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {current.label}
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[#E8ECF3] rounded-lg shadow-lg z-50 py-1 animate-[fadeIn_0.1s_ease-out]">
          {VARIATIONS.map((v) => (
            <button
              key={v.path}
              onClick={() => {
                setOpen(false);
                if (v.path !== location.pathname) {
                  navigate(v.path, { state: location.state });
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors border-none cursor-pointer ${
                v.path === location.pathname
                  ? 'bg-[#EFF6FF] text-[#1957DB] font-medium'
                  : 'text-gray-700 hover:bg-gray-50 bg-transparent'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

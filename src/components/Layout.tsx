import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { storage } from '../utils/storage'
import { usePageTracking } from '@/hooks/usePageTracking'
import { trackEvent, AnalyticsEvents } from '../utils/analytics'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  usePageTracking()

  const isSettings = location.pathname === '/settings'
  const isWorkflow = location.pathname === '/experience-center/workflow'
  const isHomepage = location.pathname === '/experience-center' || location.pathname === '/'

  // Settings page: simple layout with back button
  if (isSettings) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="h-14 px-6 flex items-center flex-shrink-0 bg-white border-b border-gray-200">
          <button
            onClick={() => navigate('/experience-center')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex-1" />
          <span className="text-sm font-medium text-gray-900">Settings</span>
          <div className="flex-1" />
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    )
  }

  // Experience Center: clean standalone layout
  return (
    <div className="flex flex-col h-screen relative">
      {/* Full-bleed background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/gradient-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Top bar — hidden on workflow page (nav is inline there) */}
      {!isWorkflow && (
        <div className="h-14 px-4 md:px-6 flex items-center flex-shrink-0 relative z-10 window-drag">
          <Link
            to="/experience-center"
            onClick={(e) => { e.preventDefault(); navigate('/experience-center'); }}
            className="flex items-center gap-2 md:gap-3 window-no-drag cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          >
            <img src="/td-icon.svg" alt="Treasure AI" className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" />
            <span className="text-xs md:text-sm font-semibold truncate" style={{ fontFamily: "'Manrope', sans-serif", background: 'linear-gradient(90deg, #0082DE, #3C00C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Treasure AI Experience Center
            </span>
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => {
              trackEvent(AnalyticsEvents.WALKTHROUGH_CTA_CLICK, {
                cta_source: 'top_nav',
                page: isHomepage ? 'landing' : 'other',
              });
              window.dispatchEvent(new CustomEvent('open-booking-modal', { detail: { source: 'top_nav' } }));
            }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-semibold rounded-full transition-colors shadow-sm window-no-drag cursor-pointer ${
              isHomepage
                ? 'text-gray-700 border border-gray-300 bg-white hover:border-gray-400 hover:text-gray-900'
                : 'text-white bg-gray-900 hover:bg-gray-800'
            }`}
          >
            Book a walkthrough
          </button>
        </div>
      )}
      {/* Content */}
      <main className="flex-1 overflow-hidden relative z-10">
        <Outlet />
      </main>
    </div>
  )
}

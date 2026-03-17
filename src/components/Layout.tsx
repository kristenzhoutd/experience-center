import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSettingsStore } from '../stores/settingsStore'
import { useChatStore } from '../stores/chatStore'

type ActiveSuite = 'personalization' | 'paid-media' | 'ai-marketing-lab' | null

// Routes that belong to each suite
const personalizationRoutes = ['/chat', '/campaigns', '/campaign-overview', '/ranking', '/briefs', '/pages', '/audiences', '/assets', '/content-spots', '/visual-editor', '/personalization-settings']

// Routes that belong to the campaign section (shown in sub-nav)
const campaignSectionRoutes = ['/campaigns', '/campaign-overview', '/ranking', '/briefs']
const campaignSubNavItems = [
  { path: '/campaign-overview', label: 'Overview' },
  { path: '/campaigns', label: 'Campaigns' },
  { path: '/ranking', label: 'Rankings' },
  { path: '/briefs', label: 'Briefs' },
]
const paidMediaRoutes = ['/campaign-chat', '/pm-campaigns', '/unified', '/unified-view', '/reports', '/pm-settings', '/campaign-launch']
const aiMarketingLabRoutes = ['/ai-marketing-lab']

// Global routes that don't belong to any suite
const globalRoutes = ['/settings']

function detectSuite(pathname: string): ActiveSuite | null {
  if (globalRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) return null
  if (aiMarketingLabRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) return 'ai-marketing-lab'
  if (paidMediaRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))) return 'paid-media'
  return 'personalization'
}

// Top navigation items per suite
const personalizationTopNav = [
  { path: '/chat', label: 'Chat', isIcon: true, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { path: '/campaigns', label: 'Campaigns', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { path: '/pages', label: 'Pages', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { path: '/audiences', label: 'Audiences', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { path: '/assets', label: 'Assets', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { path: '/personalization-settings', label: 'Settings', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

const paidMediaTopNav = [
  { path: '/campaign-chat', label: 'Campaign Chat', isIcon: true, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { path: '/unified-view', label: 'Command Center', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )},
  { path: '/pm-campaigns', label: 'Campaigns', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { path: '/reports', label: 'Reports', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { path: '/pm-settings', label: 'Settings', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

const aiMarketingLabTopNav = [
  { path: '/ai-marketing-lab', label: 'Home', isIcon: true, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { path: '/settings', label: 'Settings', isIcon: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeSuite, setActiveSuite] = useState<ActiveSuite>(() => detectSuite(location.pathname))
  const parentSegments = useSettingsStore((s) => s.parentSegments)
  const selectedParentSegment = useSettingsStore((s) => s.selectedParentSegmentId)
  const isLoadingParentSegments = useSettingsStore((s) => s.isLoadingParentSegments)
  const parentSegmentError = useSettingsStore((s) => s.parentSegmentError)
  const fetchParentSegments = useSettingsStore((s) => s.fetchParentSegments)
  const storeSelectParentSegment = useSettingsStore((s) => s.selectParentSegment)
  const [showParentSegmentDropdown, setShowParentSegmentDropdown] = useState(false)
  const [parentSegmentSearch, setParentSegmentSearch] = useState('')
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })

  // Sync activeSuite when route changes (e.g. browser back/forward)
  useEffect(() => {
    const detected = detectSuite(location.pathname)
    if (detected !== activeSuite) setActiveSuite(detected)
  }, [location.pathname])

  const topNavItems = activeSuite === 'personalization' ? personalizationTopNav : activeSuite === 'paid-media' ? paidMediaTopNav : activeSuite === 'ai-marketing-lab' ? aiMarketingLabTopNav : []
  const homeRoute = activeSuite === 'personalization' ? '/chat' : activeSuite === 'paid-media' ? '/campaign-chat' : '/ai-marketing-lab'

  const filteredParentSegments = useMemo(() => {
    if (!parentSegmentSearch.trim()) return parentSegments
    const query = parentSegmentSearch.toLowerCase()
    return parentSegments.filter(s => s.name.toLowerCase().includes(query))
  }, [parentSegments, parentSegmentSearch])

  // Fetch parent segments from Treasure Data on mount
  useEffect(() => {
    fetchParentSegments()
  }, [fetchParentSegments])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showParentSegmentDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.parent-segment-dropdown-container')) {
          setShowParentSegmentDropdown(false)
          setParentSegmentSearch('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showParentSegmentDropdown])

  // Handle Home click - clear chat and navigate to landing page
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    useChatStore.getState().resetChat()
    navigate(homeRoute, { replace: true })
  }

  const handleSuiteSwitch = (suite: ActiveSuite) => {
    if (suite === activeSuite) return
    setActiveSuite(suite)
    navigate(suite === 'personalization' ? '/chat' : suite === 'paid-media' ? '/campaign-chat' : '/ai-marketing-lab')
  }

  const handleParentSegmentSelect = (segmentId: string) => {
    storeSelectParentSegment(segmentId)
    setShowParentSegmentDropdown(false)
  }

  const getSelectedSegmentName = () => {
    const segment = parentSegments.find(s => s.id === selectedParentSegment)
    return segment?.name || 'Select Parent Segment'
  }

  const isExperienceLab = activeSuite === 'ai-marketing-lab'

  // Experience Center: clean standalone layout
  if (isExperienceLab) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Top bar */}
        <div
          className="h-14 px-4 md:px-6 flex items-center flex-shrink-0 border-b border-gray-100 bg-white window-drag"
        >
          <Link
            to="/ai-marketing-lab"
            onClick={(e) => { e.preventDefault(); navigate('/ai-marketing-lab'); }}
            className="flex items-center gap-2 md:gap-3 window-no-drag cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          >
            <img src="/td-icon.svg" alt="Treasure AI" className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" />
            <span className="text-xs md:text-sm font-semibold text-gray-900 truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Treasure AI Experience Center
            </span>
          </Link>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-400 mr-6 window-no-drag">
            Powered by Treasure AI
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-1.5 text-[11px] md:text-xs font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-colors shadow-sm window-no-drag cursor-pointer"
          >
            Book a walkthrough
          </button>
        </div>
        {/* Content */}
        <main className="flex-1 overflow-hidden" style={{
          backgroundImage: 'url(/marketing-lab-bg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}>
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Icon-only Sidebar */}
      <aside className="w-14 bg-white border-r border-gray-100 flex flex-col items-center py-4">
        {/* Logo - draggable area for macOS traffic lights */}
        <div className="mb-6 window-drag">
          <img src="/td-icon.svg" alt="Logo" className="w-12 h-12" />
        </div>

        {/* Suite switcher icons */}
        <div className="flex flex-col items-center space-y-1 mb-4">
          {/* Personalization Suite */}
          <button
            title="Personalization"
            onClick={() => handleSuiteSwitch('personalization')}
            className={`group w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              activeSuite === 'personalization'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </button>

          {/* Paid Media Suite */}
          <button
            title="Paid Media"
            onClick={() => handleSuiteSwitch('paid-media')}
            className={`group w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              activeSuite === 'paid-media'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          {/* Treasure AI Experience Center Suite */}
          <button
            title="Treasure AI Experience Center"
            onClick={() => handleSuiteSwitch('ai-marketing-lab')}
            className={`group w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              activeSuite === 'ai-marketing-lab'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.47 4.41a2.25 2.25 0 01-2.133 1.59h-6.794a2.25 2.25 0 01-2.133-1.59L5 14.5m14 0H5" />
            </svg>
          </button>
        </div>

        <div className="w-8 border-t border-gray-200 mb-4" />

        {/* Placeholder nav items (disabled) */}
        <nav className="flex-1 flex flex-col items-center space-y-1">
          {[
            { label: 'Favorites', icon: '/icons/nav-favorites.svg' },
            { label: 'Data', icon: '/icons/nav-data.svg' },
          ].map((item) => (
            <button
              key={item.label}
              title={item.label}
              className="group w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-default"
            >
              <img src={item.icon} alt={item.label} className="h-10 w-auto transition-all group-hover:brightness-50" />
            </button>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="flex flex-col items-center space-y-1">
          <Link
            to="/settings"
            title="Settings"
            className={`group w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              location.pathname === '/settings'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm mt-2">
            A
          </div>
        </div>
      </aside>

      {/* Main content area with top nav */}
      <div
        className="flex-1 flex flex-col overflow-hidden noise-bg"
        style={location.pathname.startsWith('/ai-marketing-lab') ? {
          backgroundImage: 'url(/marketing-lab-bg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : location.pathname === '/campaign-chat' || location.pathname === '/pm-campaigns' || location.pathname === '/unified' || location.pathname === '/unified-view' || location.pathname === '/reports' || location.pathname === '/pm-settings' || location.pathname === '/campaign-launch' ? {
          backgroundImage: 'url(/gradient-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {
          background: `
            radial-gradient(ellipse 80% 80% at -10% 100%, rgba(248,180,160,0.7) 0%, rgba(248,180,160,0.3) 40%, rgba(248,180,160,0) 70%),
            radial-gradient(ellipse 70% 90% at 110% 100%, rgba(120,220,232,0.6) 0%, rgba(120,220,232,0.3) 40%, rgba(120,220,232,0) 70%),
            linear-gradient(135deg, #fdf4f0 0%, #f9f9f9 40%, #f4fafa 60%, #eefbfb 100%)
          `
        }}
      >
        {/* Top Navigation Bar - draggable for window movement */}
        <div className="h-16 px-8 flex items-center flex-shrink-0 relative z-30 window-drag bg-transparent" style={{ overflow: 'visible' }}>
          {/* Suite Title */}
          <div className="flex items-center gap-4 mr-8 window-no-drag">
            <h1 className="text-base font-semibold text-gray-900">
              {activeSuite === 'personalization' ? 'Personalization' : activeSuite === 'paid-media' ? 'Paid Media' : activeSuite === 'ai-marketing-lab' ? 'Treasure AI Experience Center' : 'Settings'}
            </h1>
          </div>

          {/* Left - Main Navigation (changes per active suite) */}
          <div className="flex items-center gap-2 window-no-drag">
            {topNavItems.map((item) => {
              const isActive = item.path === '/campaigns'
                ? campaignSectionRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + '/'))
                : location.pathname === item.path ||
                  (item.path !== homeRoute && location.pathname.startsWith(item.path))

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={item.path === homeRoute ? handleHomeClick : undefined}
                  className={`flex items-center gap-1.5 h-9 px-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-black/5 text-black'
                      : 'text-[#666] hover:text-black hover:bg-black/5'
                  }`}
                  style={{ fontFamily: "'Manrope', sans-serif", fontSize: '14px' }}
                >
                  {item.icon}
                  {!item.isIcon && item.label}
                </Link>
              )
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right - Parent Segment */}
          <div className="flex items-center gap-2 mr-3 relative parent-segment-dropdown-container window-no-drag">
            <button
              ref={dropdownTriggerRef}
              onClick={() => {
                if (!showParentSegmentDropdown && dropdownTriggerRef.current) {
                  const rect = dropdownTriggerRef.current.getBoundingClientRect()
                  setDropdownPos({ top: rect.bottom + 8, left: rect.right - 320 })
                }
                setShowParentSegmentDropdown(!showParentSegmentDropdown)
              }}
              disabled={isLoadingParentSegments}
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm text-gray-600 backdrop-blur-sm bg-white/10 border border-white/60 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] hover:bg-white/40 hover:shadow-[0_4px_8px_rgba(0,0,0,0.03),0_12px_32px_rgba(0,0,0,0.06)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingParentSegments ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </>
              ) : parentSegmentError ? (
                <>
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-600">Error loading</span>
                </>
              ) : (
                <>
                  <span>{getSelectedSegmentName()}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {/* Dropdown menu - rendered via portal to escape overflow-hidden */}
            {showParentSegmentDropdown && !isLoadingParentSegments && !parentSegmentError && createPortal(
              <div
                className="fixed w-80 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col parent-segment-dropdown-container"
                style={{ top: dropdownPos.top, left: dropdownPos.left, maxHeight: 'calc(100vh - 80px)', zIndex: 9999 }}
              >
                {/* Search input */}
                <div className="p-2 border-b border-gray-100 flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search segments..."
                    value={parentSegmentSearch}
                    onChange={(e) => setParentSegmentSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                {filteredParentSegments.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    {parentSegments.length === 0 ? 'No parent segments found' : 'No matching segments'}
                  </div>
                ) : (
                  <div className="py-1 overflow-y-auto flex-1">
                    {filteredParentSegments.map((segment) => (
                      <button
                        key={segment.id}
                        onClick={() => {
                          handleParentSegmentSelect(segment.id)
                          setParentSegmentSearch('')
                        }}
                        className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${selectedParentSegment === segment.id ? 'bg-blue-500' : 'bg-transparent border-2 border-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{segment.name}</div>
                          {segment.count && (
                            <div className="text-xs text-gray-500 mt-0.5">({segment.count} records)</div>
                          )}
                          {segment.masterTable && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">{segment.masterTable}</div>
                          )}
                          {segment.description && (
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">{segment.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>,
              document.body
            )}

            {/* Error tooltip */}
            {parentSegmentError && showParentSegmentDropdown && createPortal(
              <div
                className="fixed w-72 bg-white rounded-xl shadow-lg border border-red-200 p-4 parent-segment-dropdown-container"
                style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
              >
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900">Failed to load parent segments</div>
                    <div className="text-xs text-red-700 mt-1">{parentSegmentError}</div>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Right - Notification bell */}
          <div className="flex items-center window-no-drag">
            <button className="relative w-7 h-7 flex items-center justify-center rounded-md p-1 transition-colors hover:bg-black/5">
              <svg className="w-4 h-4 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <div className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-[#F6339A] rounded-full" />
            </button>
          </div>
        </div>

        {/* Campaign sub-navigation */}
        {activeSuite === 'personalization' && campaignSectionRoutes.some(r => location.pathname === r || location.pathname.startsWith(r + '/')) && (
          <div className="px-8 flex-shrink-0">
            <div className="flex items-center gap-6 border-b border-gray-200">
              {campaignSubNavItems.map((tab) => {
                const isTabActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`relative pb-2.5 pt-1 text-sm font-medium transition-colors ${
                      isTabActive
                        ? 'text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {tab.label}
                    {isTabActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 overflow-hidden ${activeSuite === 'paid-media' ? 'p-4' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Personalization suite pages
import ChatPage from './pages/ChatPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import BriefsPage from './pages/BriefsPage';
import PagesPage from './pages/PagesPage';
import PageEditorPage from './pages/PageEditorPage';
import AudiencesPage from './pages/AudiencesPage';
import AssetsPage from './pages/AssetsPage';
import CompanyContextPage from './pages/CompanyContextPage';
import ContentSpotsPage from './pages/ContentSpotsPage';
import VisualEditorPage from './pages/VisualEditorPage';
import CampaignAnalysisPage from './pages/CampaignAnalysisPage';
import RankingPage from './pages/RankingPage';
import CampaignOverviewPage from './pages/CampaignOverviewPage';

// Paid media suite pages
import CampaignChatPage from './pages/CampaignChatPage';
import PmCampaignsPage from './pages/PmCampaignsPage';
import UnifiedDashboardPage from './pages/UnifiedDashboardPage';
import UnifiedViewPage from './pages/UnifiedViewPage';
import ReportsDashboardPage from './pages/ReportsDashboardPage';
import CampaignLaunchPage from './pages/CampaignLaunchPage';
import CampaignLaunchTabbedPage from './pages/campaignLaunch/CampaignLaunchTabbedPage';
import CampaignLaunchWizardPage from './pages/campaignLaunch/CampaignLaunchWizardPage';
import CampaignLaunchAccordionPage from './pages/campaignLaunch/CampaignLaunchAccordionPage';
import CampaignLaunchStickyNavPage from './pages/campaignLaunch/CampaignLaunchStickyNavPage';
import CampaignLaunchCommandPage from './pages/campaignLaunch/CampaignLaunchCommandPage';
import CampaignLaunchSidebarAccordionPage from './pages/campaignLaunch/CampaignLaunchSidebarAccordionPage';

// Treasure AI Experience Center pages
import ExperienceCenterPage from './pages/ExperienceCenterPage';
import ExperienceCenterWorkflowPage from './pages/ExperienceCenterWorkflowPage';

// Shared pages
import SettingsPage from './pages/SettingsPage';
import PersonalizationSettingsPage from './pages/PersonalizationSettingsPage';
import PaidMediaSettingsPage from './pages/PaidMediaSettingsPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Default: redirect to personalization chat */}
          <Route path="/" element={<Navigate to="/chat" replace />} />

          {/* Personalization suite routes */}
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/campaigns/:id/analysis" element={<CampaignAnalysisPage />} />
          <Route path="/campaign-overview" element={<CampaignOverviewPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/briefs" element={<BriefsPage />} />
          <Route path="/pages" element={<PagesPage />} />
          <Route path="/pages/:id" element={<PageEditorPage />} />
          <Route path="/audiences" element={<AudiencesPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/company-context" element={<CompanyContextPage />} />
          <Route path="/content-spots" element={<ContentSpotsPage />} />
          <Route path="/visual-editor" element={<VisualEditorPage />} />

          {/* Paid media suite routes */}
          <Route path="/campaign-chat" element={<CampaignChatPage />} />
          <Route path="/pm-campaigns" element={<PmCampaignsPage />} />
          {/* Deprecated: redirect /optimize to /pm-campaigns */}
          <Route path="/optimize" element={<Navigate to="/pm-campaigns" replace />} />
          <Route path="/unified" element={<UnifiedDashboardPage />} />
          <Route path="/unified-view" element={<UnifiedViewPage />} />
          <Route path="/reports" element={<ReportsDashboardPage />} />
          <Route path="/campaign-launch" element={<CampaignLaunchSidebarAccordionPage />} />
          <Route path="/campaign-launch/scroll" element={<CampaignLaunchPage />} />
          <Route path="/campaign-launch/tabbed" element={<CampaignLaunchTabbedPage />} />
          <Route path="/campaign-launch/wizard" element={<CampaignLaunchWizardPage />} />
          <Route path="/campaign-launch/accordion" element={<CampaignLaunchAccordionPage />} />
          <Route path="/campaign-launch/sticky-nav" element={<CampaignLaunchStickyNavPage />} />
          <Route path="/campaign-launch/command" element={<CampaignLaunchCommandPage />} />

          {/* Treasure AI Experience Center routes */}
          <Route path="/experience-center" element={<ExperienceCenterPage />} />
          <Route path="/experience-center/workflow" element={<ExperienceCenterWorkflowPage />} />
          {/* Redirects from old routes */}
          <Route path="/ai-marketing-lab" element={<Navigate to="/experience-center" replace />} />
          <Route path="/ai-marketing-lab/workflow" element={<Navigate to="/experience-center/workflow" replace />} />

          {/* Shared routes */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/personalization-settings" element={<PersonalizationSettingsPage />} />
          <Route path="/pm-settings" element={<PaidMediaSettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;

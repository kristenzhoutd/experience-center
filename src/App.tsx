import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import ExperienceCenterPage from './pages/ExperienceCenterPage';
import ExperienceCenterWorkflowPage from './pages/ExperienceCenterWorkflowPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/experience-center" replace />} />
          <Route path="/experience-center" element={<ExperienceCenterPage />} />
          <Route path="/experience-center/workflow" element={<ExperienceCenterWorkflowPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/experience-center" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;

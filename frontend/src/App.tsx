import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FanAssistant } from './pages/FanAssistant';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { VolunteerAssistant } from './pages/VolunteerAssistant';
import { TransportPlanner } from './pages/TransportPlanner';
import { EmergencyCenter } from './pages/EmergencyCenter';
import { SettingsPage } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fan-assistant" element={<FanAssistant />} />
            <Route path="/operations-dashboard" element={<OperationsDashboard />} />
            <Route path="/volunteer-assistant" element={<VolunteerAssistant />} />
            <Route path="/transport" element={<TransportPlanner />} />
            <Route path="/emergency" element={<EmergencyCenter />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </Router>
    </AccessibilityProvider>
  );
};
export default App;

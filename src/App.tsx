import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { InstancesPage } from './pages/InstancesPage';
import { LoadBalancerPage } from './pages/LoadBalancerPage';
import { AutoScalingPage } from './pages/AutoScalingPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { LoadTestingPage } from './pages/LoadTestingPage';
import { EventsPage } from './pages/EventsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/instances" element={<InstancesPage />} />
          <Route path="/load-balancer" element={<LoadBalancerPage />} />
          <Route path="/auto-scaling" element={<AutoScalingPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="/load-testing" element={<LoadTestingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

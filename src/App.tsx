import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import { ConfigPage } from '@/routes/ConfigPage';
import { WidgetPage } from '@/routes/WidgetPage';
import { HomePage } from '@/routes/HomePage';
import { LoginPage } from '@/routes/LoginPage';
import { TeamPage } from '@/routes/TeamPage';
import { AnalyticsPage } from '@/routes/AnalyticsPage';
import { KnowledgePage } from '@/routes/KnowledgePage';
import { IntegrationsPage } from '@/routes/IntegrationsPage';
import { ApiKeysPage } from '@/routes/ApiKeysPage';
import { SettingsPage } from '@/routes/SettingsPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/widget/:uuid" element={<WidgetPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected pages with MainLayout */}
          {/* When ready to enable auth, wrap these with ProtectedRoute */}
          <Route
            path="/"
            element={
              // <ProtectedRoute>
                <ConfigPage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/config"
            element={
              // <ProtectedRoute>
                <ConfigPage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge"
            element={
              // <ProtectedRoute>
                <KnowledgePage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              // <ProtectedRoute>
                <TeamPage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              // <ProtectedRoute>
                <AnalyticsPage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              // <ProtectedRoute>
                <IntegrationsPage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/api-keys"
            element={
              // <ProtectedRoute>
                <ApiKeysPage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              // <ProtectedRoute>
                <SettingsPage />
              // </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ConfigPage } from '@/routes/ConfigPage';
import { WidgetPage } from '@/routes/WidgetPage';
import { HomePage } from '@/routes/HomePage';
import { LoginPage } from '@/routes/LoginPage';
import { TeamPage } from '@/routes/TeamPage';
import { IntegrationsPage } from '@/routes/IntegrationsPage';
import { ApiKeysPage } from '@/routes/ApiKeysPage';
import { SettingsPage } from '@/routes/SettingsPage';
import { AccountSettingsPage } from '@/routes/AccountSettingsPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/widget/:uuid" element={<WidgetPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/config"
            element={
              <ProtectedRoute>
                <ConfigPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <TeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-keys"
            element={
              <ProtectedRoute>
                <ApiKeysPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-settings"
            element={
              <ProtectedRoute>
                <AccountSettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

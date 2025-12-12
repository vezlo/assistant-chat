import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getCompany, updateCompanySettings, type ResponseMode } from '@/api';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function AISettingsTab() {
  const { token } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<ResponseMode>('user');

  useEffect(() => {
    async function loadSettings() {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        const company = await getCompany(token);
        setResponseMode(company.response_mode);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [token]);

  const handleModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!token) return;
    
    const newMode = e.target.value as ResponseMode;
    setResponseMode(newMode); // Optimistic update
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateCompanySettings(token, { response_mode: newMode });
      setSuccessMessage('Settings updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="max-w-xl space-y-8">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">AI Response Style</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="mb-4">
              <label htmlFor="response-mode" className="block text-sm font-medium text-gray-700 mb-1">
                Response Mode
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Choose how the AI assistant communicates with your users.
              </p>
              
              <div className="relative">
                <select
                  id="response-mode"
                  value={responseMode}
                  onChange={handleModeChange}
                  disabled={saving}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="user">User (Friendly & Conversational)</option>
                  <option value="developer">Developer (Technical & Concise)</option>
                </select>
                
                {saving && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-2 bg-red-50 p-3 rounded border border-red-100">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 text-sm text-green-600 mt-2 bg-green-50 p-3 rounded border border-green-100">
                <CheckCircle className="h-4 w-4" />
                <span>{successMessage}</span>
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-500">
              <p>
                <strong>User Mode:</strong> Best for general customer support and non-technical queries.
              </p>
              <p className="mt-1">
                <strong>Developer Mode:</strong> Optimized for technical documentation, code snippets, and API references.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


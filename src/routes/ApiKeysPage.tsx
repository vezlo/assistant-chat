import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useIsAdmin } from '@/utils/useIsAdmin';
import { Lock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getApiKeyStatus, generateApiKey, type ApiKeyResponse } from '@/api/apiKeys';
import toast, { Toaster } from 'react-hot-toast';
import { Key, Copy, RefreshCw, Info, Eye, EyeOff, Check } from 'lucide-react';
import { LoadingState } from '@/components/ui/LoadingState';

export function ApiKeysPage() {
  const { token } = useApp();
  const isAdmin = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [keyExists, setKeyExists] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const status = await getApiKeyStatus(token);
      setKeyExists(status.exists);
    } catch (error) {
      console.error('Failed to load API key status:', error);
      toast.error('Failed to load API key status');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!token) return;

    try {
      setRegenerating(true);
      const response: ApiKeyResponse = await generateApiKey(token);
      setApiKey(response.api_key);
      setKeyExists(true);
      setShowKey(true);
      toast.success('API key generated successfully');
    } catch (error: any) {
      console.error('Failed to generate API key:', error);
      toast.error(error.message || 'Failed to generate API key');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!apiKey) return;

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy API key');
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600">Only administrators can access API keys management.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Toaster position="top-right" />
      <div className="max-w-[1400px] mx-auto px-12 py-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">API Keys</h1>
          <p className="text-gray-600">Manage your API key for authenticating requests to assistant-server knowledge items APIs. Primarily used with src-to-kb to send raw content, chunks, or both chunks and embeddings.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <LoadingState message="Loading API key..." />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Key className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">API Key</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Use this key to authenticate requests to assistant-server knowledge items APIs, including data ingestion from src-to-kb</p>
                  </div>
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                  {regenerating ? 'Regenerating...' : 'Regenerate Key'}
                </button>
              </div>

              {keyExists || apiKey ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">API Key</label>
                      {apiKey && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowKey(!showKey)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                            title={showKey ? 'Hide key' : 'Show key'}
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={handleCopy}
                            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                            title="Copy key"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 font-mono text-sm bg-white px-4 py-3 rounded border border-gray-200 text-gray-900 break-all">
                        {apiKey ? (showKey ? apiKey : maskKey(apiKey)) : '••••••••••••••••••••••••••••••••'}
                      </code>
                    </div>
                  </div>

                  {!apiKey && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 font-medium mb-1">API Key Cannot Be Revealed</p>
                        <p className="text-sm text-amber-700">
                          For security reasons, API keys cannot be retrieved once generated. If you need to view or copy your key, please regenerate it using the button above.
                        </p>
                      </div>
                    </div>
                  )}

                  {apiKey && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 font-medium mb-1">Important Security Notice</p>
                        <p className="text-sm text-blue-700">
                          Save this key securely. It will not be shown again. If you lose it, you'll need to regenerate a new key.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Key className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No API Key Generated</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Generate an API key to start using Vezlo's programmatic API. This key will be used to authenticate your requests.
                  </p>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    {regenerating ? 'Generating...' : 'Generate API Key'}
                  </button>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage Example</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100 font-mono">
                    <code>{`curl -X POST https://your-server.com/api/knowledge/items \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Example", "type": "document", "content": "Example content"}'`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

import { useState } from 'react';
import { Copy, Check, Settings, Code2, Play, Bot, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import type { WidgetConfig } from '@/types';
import { generateId } from '@/utils';
import { VezloFooter } from '@/components/ui/VezloFooter';
import { THEME } from '@/config/theme';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ConversationsTab } from '@/components/conversations/ConversationsTab';

export function ConfigPage() {
  const [config, setConfig] = useState<WidgetConfig>({
    uuid: generateId(),
    theme: 'light',
    position: 'bottom-right',
    size: { width: 420, height: 600 },
    title: 'AI Assistant',
    subtitle: 'Ask me anything',
    placeholder: 'Type your message...',
    welcomeMessage: 'Hello! How can I help you today?',
    apiUrl: 'http://localhost:3000',
    apiKey: '',
    defaultOpen: false, // Default to closed for embedded widgets
  });

  const [themeColor, setThemeColor] = useState<string>(THEME.primary.hex);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'playground' | 'embed' | 'conversations'>('config');


  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    return `<script type="text/javascript" src="${baseUrl}/widget.js"></script>
<script>
  addVezloChatWidget('${config.uuid}', '${baseUrl}');
</script>`;
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <MainLayout>
      <div className={activeTab === 'conversations' ? 'transition-all duration-200' : 'max-w-[1400px] mx-auto px-12 py-8 pb-16 transition-all duration-200'}>
        {activeTab !== 'conversations' && (
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Configure Your Chat Assistant</h1>
            <p className="text-gray-600">Customize your Vezlo assistant and get the embed code</p>
          </div>
        )}

        <div className="w-full">
          {/* Configuration Panel */}
          <div className={`bg-white ${activeTab === 'conversations' ? '' : 'rounded-lg border border-gray-200'}`}>
            {/* Tab Navigation */}
            <div className={`border-b border-gray-200 ${activeTab === 'conversations' ? 'px-8 py-1' : ''}`}>
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('config')}
                  className={`${activeTab === 'conversations' ? 'px-4 py-2.5' : 'px-6 py-4'} border-b-2 font-medium text-sm flex items-center gap-2 transition-colors group cursor-pointer ${
                    activeTab === 'config'
                        ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings
                    className={`w-4 h-4 transition-colors ${
                      activeTab === 'config'
                        ? 'text-emerald-600'
                        : 'text-gray-400 group-hover:text-emerald-600'
                    }`}
                  />
                  Configuration
                </button>
                <button
                  onClick={() => setActiveTab('playground')}
                  className={`${activeTab === 'conversations' ? 'px-4 py-2.5' : 'px-6 py-4'} border-b-2 font-medium text-sm flex items-center gap-2 transition-colors group cursor-pointer ${
                    activeTab === 'playground'
                        ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Play
                    className={`w-4 h-4 transition-colors ${
                      activeTab === 'playground'
                        ? 'text-emerald-600'
                        : 'text-gray-400 group-hover:text-emerald-600'
                    }`}
                  />
                  Playground
                </button>
                <button
                  onClick={() => setActiveTab('embed')}
                  className={`${activeTab === 'conversations' ? 'px-4 py-2.5' : 'px-6 py-4'} border-b-2 font-medium text-sm flex items-center gap-2 transition-colors group cursor-pointer ${
                    activeTab === 'embed'
                        ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Code2
                    className={`w-4 h-4 transition-colors ${
                      activeTab === 'embed'
                        ? 'text-emerald-600'
                        : 'text-gray-400 group-hover:text-emerald-600'
                    }`}
                  />
                  Embed
                </button>
                <button
                  onClick={() => setActiveTab('conversations')}
                  className={`${activeTab === 'conversations' ? 'px-4 py-2.5' : 'px-6 py-4'} border-b-2 font-medium text-sm flex items-center gap-2 transition-colors group cursor-pointer ${
                    activeTab === 'conversations'
                        ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare
                    className={`w-4 h-4 transition-colors ${
                      activeTab === 'conversations'
                        ? 'text-emerald-600'
                        : 'text-gray-400 group-hover:text-emerald-600'
                    }`}
                  />
                  Conversations
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className={activeTab === 'playground' || activeTab === 'conversations' ? '' : 'p-6'}>
              {activeTab === 'config' && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Configuration Form */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Widget Title</label>
                      <input
                        type="text"
                        value={config.title}
                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                      <input
                        type="text"
                        value={config.subtitle}
                        onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                      <textarea
                        value={config.welcomeMessage}
                        onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6 flex justify-center items-start min-h-[500px] relative">
                    {/* Preview Widget */}
                    <div className="bg-white rounded-2xl shadow-2xl w-[380px] h-[450px] flex flex-col border border-gray-100 overflow-hidden backdrop-blur-sm">
                      {/* Header */}
                      <div className="text-white p-4 flex justify-between items-center relative overflow-hidden" style={{ background: `linear-gradient(to right, ${themeColor}, ${themeColor}dd, ${themeColor}bb)` }}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
                          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                        </div>
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{config.title}</h3>
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                              <p className="text-xs text-white/80">Online • {config.subtitle}</p>
                            </div>
                          </div>
                        </div>
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-gray-100">
                        <div className="flex justify-start">
                          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                            <Bot className="w-3 h-3 text-emerald-600" />
                          </div>
                          <div className="flex flex-col max-w-[75%]">
                            <div className="bg-white rounded-2xl px-3 py-2 text-xs text-gray-700 border border-gray-200 shadow-sm">
                              <span className="leading-relaxed">{config.welcomeMessage}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">10:30 AM</p>
                              <div className="flex items-center gap-1 ml-2">
                                <button className="p-1 rounded text-gray-400 hover:text-green-600 transition-colors">
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <button className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors">
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Input */}
                      <div className="border-t border-gray-200 p-3 bg-white">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={config.placeholder}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled
                          />
                          <button 
                            className="px-3 py-2 rounded-2xl text-xs text-white shadow-sm"
                            style={{ 
                              background: `linear-gradient(to right, ${themeColor}, ${themeColor}dd)`
                            }}
                          >
                            Send
                          </button>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-200 px-3 bg-gradient-to-r from-gray-50 to-white">
                        <VezloFooter size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'playground' && (
                <div className="bg-gray-50 p-8">
                  <div className="flex justify-center">
                    <iframe
                      src={`/widget/${config.uuid}?playground=true&config=${encodeURIComponent(JSON.stringify({
                        theme: config.theme,
                        position: config.position,
                        size: config.size,
                        title: config.title,
                        subtitle: config.subtitle,
                        placeholder: config.placeholder,
                        welcomeMessage: config.welcomeMessage,
                        themeColor: themeColor,
                        defaultOpen: true, // Always open in playground
                      }))}`}
                      width={String((config.size as any)?.width || 420)}
                      height={String((config.size as any)?.height || 600)}
                      frameBorder="0"
                      style={{
                        border: 'none',
                        outline: 'none',
                        // Match embed open state visuals
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'transparent'
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'conversations' && (
                <ConversationsTab />
              )}

              {activeTab === 'embed' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Embed Code</h3>
                    <button
                      onClick={copyEmbedCode}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{generateEmbedCode()}</code>
                  </pre>

                  <p className="text-sm text-gray-600 mt-4">
                    Copy this code and paste it before the closing &lt;/body&gt; tag on any HTML page.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>      
    </MainLayout>
  );
}

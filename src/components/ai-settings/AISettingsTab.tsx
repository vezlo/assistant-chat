import React, { useState, useEffect } from 'react';
import { getAISettings, updateAISettings, type AISettings } from '../../api/aiSettings';
import { useApp } from '@/contexts/AppContext';
import toast, { Toaster } from 'react-hot-toast';
import { MarkdownEditor } from './MarkdownEditor';
import { LoadingState } from '@/components/ui/LoadingState';

const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
];

export const AISettingsTab: React.FC = () => {
  const { user, token } = useApp();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const companyUuid = user?.profile?.company_uuid;
    if (!companyUuid || !token) return;
    
    try {
      setLoading(true);
      const data = await getAISettings(token, companyUuid);
      setSettings(data);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast.error('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const companyUuid = user?.profile?.company_uuid;
    if (!companyUuid || !settings || !token) return;

    try {
      setSaving(true);
      await updateAISettings(token, companyUuid, settings);
      toast.success('AI settings saved successfully');
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error('Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LoadingState message="Loading AI settings..." className="h-64" />
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No AI settings found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">AI Settings</h2>
        <p className="text-gray-600 mt-1">Configure your AI assistant's behavior and personality</p>
      </div>

      {/* Model Selection */}
      <div className="mb-8">
        <label className="block text-base font-semibold text-gray-900 mb-3">
          AI Model
        </label>
        <select
          value={settings.model}
          onChange={(e) => setSettings({ ...settings, model: e.target.value })}
          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base bg-white cursor-pointer appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em'
          }}
        >
          {AI_MODELS.map(model => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      {/* Temperature Control */}
      <div className="mb-8">
        <label className="block text-base font-semibold text-gray-900 mb-3">
          Temperature: {settings.temperature}
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Controls randomness: 0 is focused and deterministic, 1 is more creative
        </p>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-with-marks"
            style={{
              background: `linear-gradient(to right, #059669 0%, #059669 ${settings.temperature * 100}%, #e5e7eb ${settings.temperature * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between absolute w-full top-0 pointer-events-none">
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((val) => (
              <div
                key={val}
                className="w-0.5 h-2 bg-white"
                style={{ marginTop: '0px' }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Precise (0)</span>
          <span>Balanced (0.5)</span>
          <span>Creative (1)</span>
        </div>
      </div>

      {/* Prompts */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">AI Personality & Behavior</h3>
        
        {/* Row 1: Personality and Response Guidelines */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <MarkdownEditor
            label="AI Personality"
            value={settings.prompts.personality}
            onChange={(value) => setSettings({
              ...settings,
              prompts: { ...settings.prompts, personality: value }
            })}
          />
          <MarkdownEditor
            label="Response Guidelines"
            value={settings.prompts.response_guidelines}
            onChange={(value) => setSettings({
              ...settings,
              prompts: { ...settings.prompts, response_guidelines: value }
            })}
          />
        </div>

        {/* Row 2: Interaction Etiquette and Scope */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <MarkdownEditor
            label="Interaction Etiquette"
            value={settings.prompts.interaction_etiquette}
            onChange={(value) => setSettings({
              ...settings,
              prompts: { ...settings.prompts, interaction_etiquette: value }
            })}
          />
          <MarkdownEditor
            label="Scope of Assistance"
            value={settings.prompts.scope_of_assistance}
            onChange={(value) => setSettings({
              ...settings,
              prompts: { ...settings.prompts, scope_of_assistance: value }
            })}
          />
        </div>

        {/* Row 3: Formatting - Full Width */}
        <MarkdownEditor
          label="Formatting & Presentation"
          value={settings.prompts.formatting_and_presentation}
          onChange={(value) => setSettings({
            ...settings,
            prompts: { ...settings.prompts, formatting_and_presentation: value }
          })}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <Toaster position="top-right" toastOptions={{ style: { marginTop: '24px', marginRight: '24px' }, success: { iconTheme: { primary: '#10b981', secondary: '#fff' } } }} />
    </div>
  );
};

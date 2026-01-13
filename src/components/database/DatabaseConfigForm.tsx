import { Database, AlertCircle, CheckCircle, Loader2, Eye, EyeOff, Info } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface DatabaseConfigFormProps {
  dbUrl: string;
  dbKey: string;
  showDbKey: boolean;
  validating: boolean;
  validationResult: { valid: boolean; tables?: string[]; error?: string } | null;
  onDbUrlChange: (value: string) => void;
  onDbKeyChange: (value: string) => void;
  onToggleShowKey: () => void;
  onValidate: () => void;
  onSave: () => void;
  loading: boolean;
}

export function DatabaseConfigForm({
  dbUrl,
  dbKey,
  showDbKey,
  validating,
  validationResult,
  onDbUrlChange,
  onDbKeyChange,
  onToggleShowKey,
  onValidate,
  onSave,
  loading
}: DatabaseConfigFormProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-emerald-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Database Configuration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Connect your external Supabase database to create AI-powered data tools
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Database URL */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            Database URL
            <Tooltip content="Your Supabase project URL (e.g., https://xxx.supabase.co)">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </label>
          <input
            type="url"
            value={dbUrl}
            onChange={(e) => onDbUrlChange(e.target.value)}
            placeholder="https://your-project.supabase.co"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Service Role Key */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            Service Role Key
            <Tooltip content="Service role key from Supabase dashboard (Settings > API). Required for schema introspection.">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          </label>
          <div className="relative">
            <input
              type={showDbKey ? 'text' : 'password'}
              value={dbKey}
              onChange={(e) => onDbKeyChange(e.target.value)}
              placeholder="your-supabase-service-role-key"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={onToggleShowKey}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showDbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Service role key required (anon key will not work)
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onValidate}
            disabled={validating || !dbUrl || !dbKey}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            title="Test connection to your external database"
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate Connection'
            )}
          </button>

          {validationResult?.valid && (
            <button
              onClick={onSave}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              title="Save database configuration and proceed to create tools"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Continue'
              )}
            </button>
          )}
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-4 rounded-lg border ${
            validationResult.valid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            {validationResult.valid ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-900">Connection successful!</p>
                </div>
                <p className="text-sm text-green-800">
                  Found {validationResult.tables?.length || 0} table(s) available
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="font-medium text-red-900">Connection failed</p>
                </div>
                <p className="text-sm text-red-800">{validationResult.error}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

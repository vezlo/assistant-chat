import { X, Loader2, Info, Save } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import type { TableColumn } from '@/api/databaseTools';

interface ToolModalProps {
  isOpen: boolean;
  isEdit: boolean;
  tables: string[];
  selectedTable: string;
  tableSchema: TableColumn[];
  selectedColumns: Set<string>;
  toolName: string;
  toolDescription: string;
  idColumn: string;
  idColumnType: 'integer' | 'uuid' | 'string';
  requiresUserContext: boolean;
  userFilterColumn: string;
  userFilterType: 'integer' | 'uuid' | 'string';
  userContextKey: string;
  loadingSchema: boolean;
  saving: boolean;
  onClose: () => void;
  onTableChange: (tableName: string) => void;
  onColumnToggle: (columnName: string) => void;
  onToolNameChange: (value: string) => void;
  onToolDescriptionChange: (value: string) => void;
  onIdColumnChange: (value: string) => void;
  onIdColumnTypeChange: (value: 'integer' | 'uuid' | 'string') => void;
  onRequiresUserContextChange: (value: boolean) => void;
  onUserFilterColumnChange: (value: string) => void;
  onUserFilterTypeChange: (value: 'integer' | 'uuid' | 'string') => void;
  onUserContextKeyChange: (value: string) => void;
  onSave: () => void;
}

export function ToolModal({
  isOpen,
  isEdit,
  tables,
  selectedTable,
  tableSchema,
  selectedColumns,
  toolName,
  toolDescription,
  idColumn,
  idColumnType,
  requiresUserContext,
  userFilterColumn,
  userFilterType,
  userContextKey,
  loadingSchema,
  saving,
  onClose,
  onTableChange,
  onColumnToggle,
  onToolNameChange,
  onToolDescriptionChange,
  onIdColumnChange,
  onIdColumnTypeChange,
  onRequiresUserContextChange,
  onUserFilterColumnChange,
  onUserFilterTypeChange,
  onUserContextKeyChange,
  onSave
}: ToolModalProps) {
  if (!isOpen) return null;

  const isSaveDisabled = saving || !selectedTable || selectedColumns.size === 0 || !toolName || !idColumn;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Tool' : 'Create New Tool'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close this modal"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Table Selection */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => onTableChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Choose a table...</option>
                {tables.map((table) => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tool Name & Description - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Tool Name
                <Tooltip content="A unique name for this tool (e.g., 'get_user_profile'). This is how the AI will reference it internally.">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => onToolNameChange(e.target.value)}
                placeholder="get_table_data"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Description
                <Tooltip content="A clear description of what this tool does. This helps the AI understand when to use it.">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={toolDescription}
                onChange={(e) => onToolDescriptionChange(e.target.value)}
                placeholder="Retrieve data from the table"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Columns Selection */}
          {selectedTable && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Select Columns
                  <Tooltip content="Choose which columns to expose through this tool. Users will be able to query these columns via the AI assistant.">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </label>
                {selectedColumns.size > 0 && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {selectedColumns.size} selected
                  </span>
                )}
              </div>
              {loadingSchema ? (
                <div className="flex items-center justify-center py-8 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading schema...
                </div>
              ) : tableSchema.length > 0 ? (
                <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {tableSchema.map((col) => (
                    <label key={col.column_name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(col.column_name)}
                        onChange={() => onColumnToggle(col.column_name)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{col.column_name}</span>
                      <span className="text-xs text-gray-500">({col.data_type})</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">No schema available</p>
              )}
            </div>
          )}

          {/* ID Column */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                ID Column
                <Tooltip content="The primary key or unique identifier column for filtering records.">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </label>
              <select
                value={idColumn}
                onChange={(e) => onIdColumnChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select ID column...</option>
                {tableSchema.map((col) => (
                  <option key={col.column_name} value={col.column_name}>
                    {col.column_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Column Type
              </label>
              <select
                value={idColumnType}
                onChange={(e) => onIdColumnTypeChange(e.target.value as 'integer' | 'uuid' | 'string')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="integer">Integer</option>
                <option value="uuid">UUID</option>
                <option value="string">String</option>
              </select>
            </div>
          </div>

          {/* User Context Filtering */}
          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresUserContext}
                onChange={(e) => onRequiresUserContextChange(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">Enable User-Specific Filtering</span>
              <Tooltip content="Filter query results based on authenticated user context (e.g., show only current user's data).">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </Tooltip>
            </label>

            {requiresUserContext && (
              <div className="grid grid-cols-3 gap-4 pl-6 border-l-2 border-emerald-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Column
                  </label>
                  <select
                    value={userFilterColumn}
                    onChange={(e) => onUserFilterColumnChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select column...</option>
                    {tableSchema.map((col) => (
                      <option key={col.column_name} value={col.column_name}>
                        {col.column_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter Type
                  </label>
                  <select
                    value={userFilterType}
                    onChange={(e) => onUserFilterTypeChange(e.target.value as 'integer' | 'uuid' | 'string')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="integer">Integer</option>
                    <option value="uuid">UUID</option>
                    <option value="string">String</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context Key
                  </label>
                  <select
                    value={userContextKey}
                    onChange={(e) => onUserContextKeyChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="user_id">user_id</option>
                    <option value="user_uuid">user_uuid</option>
                    <option value="company_id">company_id</option>
                    <option value="company_uuid">company_uuid</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaveDisabled}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 pointer-events-none" />
                {isEdit ? 'Update Tool' : 'Create Tool'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

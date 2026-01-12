import { Loader2, Save } from 'lucide-react';
import type { TableColumn } from '@/api/databaseTools';

interface TableConfig {
  columns: Set<string>;
  schema: TableColumn[];
  toolName: string;
  description: string;
  idColumn: string;
  idColumnType: 'integer' | 'uuid' | 'string';
  requiresUserContext: boolean;
  userFilterColumn: string;
  userFilterType: 'integer' | 'uuid' | 'string';
  userContextKey: string;
}

interface TableSelectorProps {
  tables: string[];
  selectedTables: Set<string>;
  tableConfigs: Map<string, TableConfig>;
  loadingTables: Set<string>;
  onTableToggle: (tableName: string) => void;
  onColumnToggle: (tableName: string, columnName: string) => void;
  onProceed: () => void;
  saving: boolean;
  loading: boolean;
}

export function TableSelector({
  tables,
  selectedTables,
  tableConfigs,
  loadingTables,
  onTableToggle,
  onColumnToggle,
  onProceed,
  saving,
  loading
}: TableSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Tables & Columns</h3>
          <p className="text-sm text-gray-600">Choose the tables you want to create AI tools for, then select the columns to expose</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mr-3" />
            <span className="text-gray-600">Loading tables...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {tables.map((tableName) => {
              const isSelected = selectedTables.has(tableName);
              const tableConfig = tableConfigs.get(tableName);
              const isLoadingSchema = loadingTables.has(tableName);

              return (
                <div key={tableName} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onTableToggle(tableName)}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="font-medium text-gray-900">{tableName}</span>
                    </label>
                    {isLoadingSchema && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm font-medium">Loading columns...</span>
                      </div>
                    )}
                  </div>

                  {isSelected && tableConfig && tableConfig.schema.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">Select columns to include:</p>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {tableConfig.columns.size} selected
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {tableConfig.schema.map((col) => (
                          <label key={col.column_name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={tableConfig.columns.has(col.column_name)}
                              onChange={() => onColumnToggle(tableName, col.column_name)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{col.column_name}</span>
                            <span className="text-xs text-gray-500">({col.data_type})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end mt-6 mb-4 mr-4">
        <button
          onClick={onProceed}
          disabled={selectedTables.size === 0 || saving}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 pointer-events-none" />
              Next: Configure Tools ({selectedTables.size})
            </>
          )}
        </button>
      </div>
    </div>
  );
}

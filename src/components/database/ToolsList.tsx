import { Plus, Edit2, Trash2, Database, Loader2 } from 'lucide-react';
import type { DatabaseTool } from '@/api/databaseTools';

interface ToolsListProps {
  tools: DatabaseTool[];
  loading: boolean;
  onCreateTool: () => void;
  onEditTool: (tool: DatabaseTool) => void;
  onDeleteTool: (toolId: string) => void;
  onDeleteConfig: () => void;
}

export function ToolsList({
  tools,
  loading,
  onCreateTool,
  onEditTool,
  onDeleteTool,
  onDeleteConfig
}: ToolsListProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Database Tools</h3>
              <p className="text-sm text-gray-600">Configure tools to expose your database through the AI assistant</p>
            </div>
          </div>
          <button
            onClick={onDeleteConfig}
            disabled={loading}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            title="Remove database configuration and all associated tools"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Configuration
              </>
            )}
          </button>
        </div>

        {/* Tools List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Configured Tools ({tools.length})
            </h4>
            <button
              onClick={onCreateTool}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
              title="Create a new database tool for a specific table"
            >
              <Plus className="w-4 h-4 pointer-events-none" />
              Create Tool
            </button>
          </div>

          {tools.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No tools configured yet</p>
              <p className="text-xs mt-1">Create your first tool to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => {
                const columnsArray = Array.isArray(tool.columns) ? tool.columns : 
                                    (typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns);
                const columnCount = Array.isArray(columnsArray) ? columnsArray.length : 0;

                return (
                  <div
                    key={tool.id}
                    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-gray-900">{tool.tool_name}</h5>
                        {!tool.enabled && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{tool.tool_description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Table: <span className="font-medium">{tool.table_name}</span></span>
                        <span>Columns: <span className="font-medium">{columnCount}</span></span>
                        <span>ID: <span className="font-medium">{tool.id_column}</span></span>
                        {tool.requires_user_context && (
                          <span className="text-emerald-600 font-medium">User Filtering</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onEditTool(tool)}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit this tool's configuration"
                      >
                        <Edit2 className="w-4 h-4 pointer-events-none" />
                      </button>
                      <button
                        onClick={() => onDeleteTool(tool.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete this tool permanently"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}

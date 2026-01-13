import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useApp } from '@/contexts/AppContext';
import * as databaseToolsApi from '@/api/databaseTools';
import type { DatabaseConfig, DatabaseTool, TableColumn } from '@/api/databaseTools';
import { DatabaseConfigForm } from './DatabaseConfigForm';
import { TableSelector } from './TableSelector';
import { ToolsList } from './ToolsList';
import { ToolModal } from './ToolModal';

type View = 'loading' | 'setup' | 'select-tables' | 'configure-tools' | 'configured';

export function DatabaseToolsTab() {
  const { token } = useApp();
  const [view, setView] = useState<View>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration state
  const [config, setConfig] = useState<DatabaseConfig | null>(null);
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [showDbKey, setShowDbKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; tables?: string[]; error?: string } | null>(null);

  // Tools state
  const [tools, setTools] = useState<DatabaseTool[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [tableConfigs, setTableConfigs] = useState<Map<string, {
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
  }>>(new Map());
  const [loadingTables, setLoadingTables] = useState<Set<string>>(new Set());
  const [schemaCache, setSchemaCache] = useState<Map<string, TableColumn[]>>(new Map());

  // Modal state
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editingTool, setEditingTool] = useState<DatabaseTool | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableSchema, setTableSchema] = useState<TableColumn[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [toolName, setToolName] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [idColumn, setIdColumn] = useState('');
  const [idColumnType, setIdColumnType] = useState<'integer' | 'uuid' | 'string'>('integer');
  const [requiresUserContext, setRequiresUserContext] = useState(false);
  const [userFilterColumn, setUserFilterColumn] = useState('');
  const [userFilterType, setUserFilterType] = useState<'integer' | 'uuid' | 'string'>('uuid');
  const [userContextKey, setUserContextKey] = useState('user_uuid');
  const [saving, setSaving] = useState(false);

  // Load initial data
  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    if (!token) return;
    
    setView('loading');
    setError(null);

    try {
      const [configResult, toolsResult] = await Promise.all([
        databaseToolsApi.getDatabaseConfig(token),
        databaseToolsApi.getDatabaseTools(token)
      ]);

      if (configResult.success && configResult.config) {
        setConfig(configResult.config);
        
        if (configResult.config.enabled) {
          const tablesResult = await databaseToolsApi.getTablesFromConfig(token, configResult.config.id);
          if (tablesResult.success && tablesResult.tables) {
            setTables(tablesResult.tables);
          }
          setView('configured');
        } else {
          setView('setup');
        }
      } else {
        setView('setup');
      }

      if (toolsResult.success && toolsResult.tools) {
        const parsedTools = toolsResult.tools.map(tool => ({
          ...tool,
          columns: typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns
        }));
        setTools(parsedTools);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      setView('setup');
    }
  };

  const handleValidate = async () => {
    if (!token || !dbUrl || !dbKey) return;

    setValidating(true);
    setValidationResult(null);
    setError(null);

    try {
      const result = await databaseToolsApi.validateDatabaseConnection(token, dbUrl, dbKey);
      
      if (result.success && result.valid && result.tables) {
        setValidationResult({ valid: true, tables: result.tables });
        setTables(result.tables);
        toast.success(`Connection validated! Found ${result.tables.length} tables.`, { duration: 5000 });
      } else {
        setValidationResult({ valid: false, error: result.error });
        setError(result.error || 'Connection validation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Validation failed');
      setValidationResult({ valid: false, error: err.message });
    } finally {
      setValidating(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!token || !validationResult?.valid) return;

    setLoading(true);
    setError(null);

    try {
      const result = config
        ? await databaseToolsApi.updateDatabaseConfig(token, config.id, dbUrl, dbKey, true)
        : await databaseToolsApi.createDatabaseConfig(token, dbUrl, dbKey);

      if (result.success && result.config) {
        setConfig(result.config);
        
        if (validationResult?.tables) {
          setTables(validationResult.tables);
        } else {
          const tablesResult = await databaseToolsApi.getTablesFromConfig(token, result.config.id);
          if (tablesResult.success && tablesResult.tables) {
            setTables(tablesResult.tables);
          }
        }
        
        const toolsResult = await databaseToolsApi.getDatabaseTools(token);
        if (toolsResult.success && toolsResult.tools && toolsResult.tools.length > 0) {
          const parsedTools = toolsResult.tools.map(tool => ({
            ...tool,
            columns: typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns
          }));
          setTools(parsedTools);
          setView('configured');
        } else {
          setView('select-tables');
        }
        
        toast.success('Database configuration saved!', { duration: 5000 });
      } else {
        setError(result.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!token || !config) return;

    if (!confirm('Delete database configuration? This will remove all associated tools.')) return;

    setLoading(true);
    setError(null);

    try {
      const result = await databaseToolsApi.deleteDatabaseConfig(token, config.id);
      
      if (result.success) {
        setConfig(null);
        setTools([]);
        setTables([]);
        setSelectedTables(new Set());
        setTableConfigs(new Map());
        setSchemaCache(new Map());
        setDbUrl('');
        setDbKey('');
        setShowDbKey(false);
        setValidationResult(null);
        setView('setup');
        toast.success('Configuration deleted', { duration: 5000 });
      } else {
        setError(result.error || 'Failed to delete configuration');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTableToggle = async (tableName: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableName)) {
      newSelected.delete(tableName);
      const newConfigs = new Map(tableConfigs);
      newConfigs.delete(tableName);
      setTableConfigs(newConfigs);
    } else {
      newSelected.add(tableName);
      await loadTableSchemaForSelection(tableName);
    }
    setSelectedTables(newSelected);
  };

  const loadTableSchemaForSelection = async (tableName: string) => {
    if (!token || !config) return;

    if (schemaCache.has(tableName)) {
      const schema = schemaCache.get(tableName)!;
      const idCol = schema.find(c => c.column_name === 'id' || c.column_name === 'uuid');
      
      const newConfigs = new Map(tableConfigs);
      newConfigs.set(tableName, {
        columns: new Set(),
        schema,
        toolName: `get_${tableName}`,
        description: `Retrieve ${tableName.replace(/^vezlo_/, '').replace(/_/g, ' ')} data`,
        idColumn: idCol?.column_name || '',
        idColumnType: idCol?.data_type === 'uuid' ? 'uuid' : idCol?.data_type === 'integer' ? 'integer' : 'string',
        requiresUserContext: false,
        userFilterColumn: '',
        userFilterType: 'uuid',
        userContextKey: 'user_uuid',
      });
      setTableConfigs(newConfigs);
      return;
    }

    setLoadingTables(prev => new Set(prev).add(tableName));
    setError(null);

    try {
      const result = await databaseToolsApi.introspectTableColumns(token, config.id, tableName);
      
      if (result.success && result.schema) {
        const schema = result.schema.columns;
        
        const newCache = new Map(schemaCache);
        newCache.set(tableName, schema);
        setSchemaCache(newCache);
        
        const idCol = schema.find(c => c.column_name === 'id' || c.column_name === 'uuid');
        
        const newConfigs = new Map(tableConfigs);
        newConfigs.set(tableName, {
          columns: new Set(),
          schema,
          toolName: `get_${tableName}`,
          description: `Retrieve ${tableName.replace(/^vezlo_/, '').replace(/_/g, ' ')} data`,
          idColumn: idCol?.column_name || '',
          idColumnType: idCol?.data_type === 'uuid' ? 'uuid' : idCol?.data_type === 'integer' ? 'integer' : 'string',
          requiresUserContext: false,
          userFilterColumn: '',
          userFilterType: 'uuid',
          userContextKey: 'user_uuid',
        });
        setTableConfigs(newConfigs);
      } else {
        toast.error(`Failed to load schema for ${tableName}`, { duration: 5000 });
      }
    } catch (err: any) {
      toast.error(`Failed to load schema for ${tableName}`, { duration: 5000 });
    } finally {
      setLoadingTables(prev => {
        const newSet = new Set(prev);
        newSet.delete(tableName);
        return newSet;
      });
    }
  };

  const handleColumnToggle = (tableName: string, columnName: string) => {
    const tableConfig = tableConfigs.get(tableName);
    if (!tableConfig) return;

    const newColumns = new Set(tableConfig.columns);
    if (newColumns.has(columnName)) {
      newColumns.delete(columnName);
    } else {
      newColumns.add(columnName);
    }

    const newConfigs = new Map(tableConfigs);
    newConfigs.set(tableName, { ...tableConfig, columns: newColumns });
    setTableConfigs(newConfigs);
  };

  const handleProceedToToolConfiguration = () => {
    setView('configure-tools');
  };

  const handleCreateAllTools = async () => {
    if (!token || !config) return;

    setSaving(true);
    setError(null);

    try {
      const toolPromises = Array.from(selectedTables).map(tableName => {
        const tableConfig = tableConfigs.get(tableName);
        if (!tableConfig || tableConfig.columns.size === 0) return null;

        const toolData = {
          table_name: tableName,
          tool_name: tableConfig.toolName,
          tool_description: tableConfig.description,
          columns: Array.from(tableConfig.columns),
          id_column: tableConfig.idColumn,
          id_column_type: tableConfig.idColumnType,
          requires_user_context: tableConfig.requiresUserContext,
          user_filter_column: tableConfig.userFilterColumn || undefined,
          user_filter_type: tableConfig.userFilterType || undefined,
          user_context_key: tableConfig.userContextKey || undefined,
        };

        return databaseToolsApi.createDatabaseTool(token, config.id, toolData);
      });

      const results = await Promise.all(toolPromises.filter(Boolean));
      const failed = results.filter(r => r && !r.success);

      if (failed.length > 0) {
        setError(`Failed to create ${failed.length} tool(s)`);
      } else {
        const toolsResult = await databaseToolsApi.getDatabaseTools(token);
        if (toolsResult.success && toolsResult.tools) {
          const parsedTools = toolsResult.tools.map(tool => ({
            ...tool,
            columns: typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns
          }));
          setTools(parsedTools);
        }
        setView('configured');
        toast.success(`Successfully created ${results.length} tool(s)!`, { duration: 5000 });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create tools');
    } finally {
      setSaving(false);
    }
  };

  const openCreateToolModal = () => {
    setModal('create');
    setEditingTool(null);
    setSelectedTable('');
    setTableSchema([]);
    setSelectedColumns(new Set());
    setToolName('');
    setToolDescription('');
    setIdColumn('');
    setIdColumnType('integer');
    setRequiresUserContext(false);
    setUserFilterColumn('');
    setUserFilterType('uuid');
    setUserContextKey('user_uuid');
  };

  const openEditToolModal = async (tool: DatabaseTool) => {
    setModal('edit');
    setEditingTool(tool);
    setSelectedTable(tool.table_name);
    setToolName(tool.tool_name);
    setToolDescription(tool.tool_description);
    setIdColumn(tool.id_column);
    setIdColumnType(tool.id_column_type);
    setRequiresUserContext(tool.requires_user_context || false);
    setUserFilterColumn(tool.user_filter_column || '');
    setUserFilterType(tool.user_filter_type || 'uuid');
    setUserContextKey(tool.user_context_key || 'user_uuid');

    const columnsArray = Array.isArray(tool.columns) ? tool.columns : 
                        (typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns);
    setSelectedColumns(new Set(columnsArray));

    await loadTableSchema(tool.table_name);
  };

  const loadTableSchema = async (tableName: string) => {
    if (!token || !config) return;

    setLoadingSchema(true);
    try {
      const result = await databaseToolsApi.introspectTableColumns(token, config.id, tableName);
      
      if (result.success && result.schema) {
        const schema = result.schema.columns;
        setTableSchema(schema);
        
        // Auto-select ID column (only if creating new tool)
        if (modal === 'create' && !editingTool && !idColumn) {
          const idCol = schema.find(c => c.column_name === 'id' || c.column_name === 'uuid');
          if (idCol) {
            setIdColumn(idCol.column_name);
            setIdColumnType(idCol.data_type === 'uuid' ? 'uuid' : idCol.data_type === 'integer' ? 'integer' : 'string');
          }
        }
      }
    } catch (err: any) {
      toast.error('Failed to load table schema', { duration: 5000 });
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    if (tableName) {
      loadTableSchema(tableName);
      // Pre-fill name and description when table is selected (only if creating new tool)
      if (modal === 'create' && !editingTool) {
        setToolName(`get_${tableName}`);
        setToolDescription(`Retrieve ${tableName.replace(/^vezlo_/, '').replace(/_/g, ' ')} data`);
      }
    } else {
      setTableSchema([]);
      setSelectedColumns(new Set());
      if (modal === 'create' && !editingTool) {
        setToolName('');
        setToolDescription('');
      }
    }
  };

  const handleColumnToggleModal = (columnName: string) => {
    const newColumns = new Set(selectedColumns);
    if (newColumns.has(columnName)) {
      newColumns.delete(columnName);
    } else {
      newColumns.add(columnName);
    }
    setSelectedColumns(newColumns);
  };

  const handleSaveTool = async () => {
    if (!token || !config) return;
    if (!selectedTable || selectedColumns.size === 0 || !toolName || !idColumn) return;

    setSaving(true);
    setError(null);

    try {
      const toolData = {
        table_name: selectedTable,
        tool_name: toolName,
        tool_description: toolDescription,
        columns: Array.from(selectedColumns),
        id_column: idColumn,
        id_column_type: idColumnType,
        requires_user_context: requiresUserContext,
        user_filter_column: userFilterColumn || undefined,
        user_filter_type: userFilterType || undefined,
        user_context_key: userContextKey || undefined,
      };

      const result = editingTool
        ? await databaseToolsApi.updateDatabaseTool(token, editingTool.id, toolData)
        : await databaseToolsApi.createDatabaseTool(token, config.id, toolData);

      if (result.success) {
        const toolsResult = await databaseToolsApi.getDatabaseTools(token);
        if (toolsResult.success && toolsResult.tools) {
          const parsedTools = toolsResult.tools.map(tool => ({
            ...tool,
            columns: typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns
          }));
          setTools(parsedTools);
        }
        setModal(null);
        toast.success(editingTool ? 'Tool updated successfully!' : 'Tool created successfully!', { duration: 5000 });
      } else {
        setError(result.error || 'Failed to save tool');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!token) return;
    if (!confirm('Delete this tool?')) return;

    setLoading(true);
    setError(null);

    try {
      const result = await databaseToolsApi.deleteDatabaseTool(token, toolId);
      
      if (result.success) {
        setTools(prev => prev.filter(t => t.id !== toolId));
        toast.success('Tool deleted', { duration: 5000 });
      } else {
        setError(result.error || 'Failed to delete tool');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { marginTop: '24px', marginRight: '24px' }, success: { iconTheme: { primary: '#10b981', secondary: '#fff' } } }} />
      
      <div>
        {/* Loading View */}
        {view === 'loading' && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mr-3" />
            <span className="text-gray-600">Loading...</span>
          </div>
        )}

        {/* Setup View */}
        {view === 'setup' && (
          <DatabaseConfigForm
            dbUrl={dbUrl}
            dbKey={dbKey}
            showDbKey={showDbKey}
            validating={validating}
            validationResult={validationResult}
            onDbUrlChange={setDbUrl}
            onDbKeyChange={setDbKey}
            onToggleShowKey={() => setShowDbKey(!showDbKey)}
            onValidate={handleValidate}
            onSave={handleSaveConfig}
            loading={loading}
          />
        )}

        {/* Select Tables View */}
        {view === 'select-tables' && (
          <TableSelector
            tables={tables}
            selectedTables={selectedTables}
            tableConfigs={tableConfigs}
            loadingTables={loadingTables}
            onTableToggle={handleTableToggle}
            onColumnToggle={handleColumnToggle}
            onProceed={handleProceedToToolConfiguration}
            saving={saving}
            loading={loading}
          />
        )}

        {/* Configure Tools View - Set ID columns and filters */}
        {view === 'configure-tools' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Tool Settings</h3>
              <p className="text-sm text-gray-600">Set ID columns and user filtering options for each selected table</p>
            </div>

            <div className="space-y-6">
              {Array.from(selectedTables).map(tableName => {
                const tableConfig = tableConfigs.get(tableName);
                if (!tableConfig) return null;

                return (
                  <div key={tableName} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900">{tableName}</h4>
                    
                    {/* Tool Name & Description */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tool Name</label>
                        <input
                          type="text"
                          value={tableConfig.toolName}
                          onChange={(e) => {
                            const newConfigs = new Map(tableConfigs);
                            newConfigs.set(tableName, { ...tableConfig, toolName: e.target.value });
                            setTableConfigs(newConfigs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <input
                          type="text"
                          value={tableConfig.description}
                          onChange={(e) => {
                            const newConfigs = new Map(tableConfigs);
                            newConfigs.set(tableName, { ...tableConfig, description: e.target.value });
                            setTableConfigs(newConfigs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* ID Column */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Column</label>
                        <select
                          value={tableConfig.idColumn}
                          onChange={(e) => {
                            const newConfigs = new Map(tableConfigs);
                            newConfigs.set(tableName, { ...tableConfig, idColumn: e.target.value });
                            setTableConfigs(newConfigs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Select ID column...</option>
                          {tableConfig.schema.map((col) => (
                            <option key={col.column_name} value={col.column_name}>{col.column_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Column Type</label>
                        <select
                          value={tableConfig.idColumnType}
                          onChange={(e) => {
                            const newConfigs = new Map(tableConfigs);
                            newConfigs.set(tableName, { ...tableConfig, idColumnType: e.target.value as any });
                            setTableConfigs(newConfigs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="integer">Integer</option>
                          <option value="uuid">UUID</option>
                          <option value="string">String</option>
                        </select>
                      </div>
                    </div>

                    {/* User Filtering */}
                    <div>
                      <label className="flex items-center gap-2 mb-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tableConfig.requiresUserContext}
                          onChange={(e) => {
                            const newConfigs = new Map(tableConfigs);
                            newConfigs.set(tableName, { ...tableConfig, requiresUserContext: e.target.checked });
                            setTableConfigs(newConfigs);
                          }}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable User-Specific Filtering</span>
                      </label>

                      {tableConfig.requiresUserContext && (
                        <div className="grid grid-cols-3 gap-4 pl-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Column</label>
                            <select
                              value={tableConfig.userFilterColumn}
                              onChange={(e) => {
                                const newConfigs = new Map(tableConfigs);
                                newConfigs.set(tableName, { ...tableConfig, userFilterColumn: e.target.value });
                                setTableConfigs(newConfigs);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select column...</option>
                              {tableConfig.schema.map((col) => (
                                <option key={col.column_name} value={col.column_name}>{col.column_name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Type</label>
                            <select
                              value={tableConfig.userFilterType}
                              onChange={(e) => {
                                const newConfigs = new Map(tableConfigs);
                                newConfigs.set(tableName, { ...tableConfig, userFilterType: e.target.value as any });
                                setTableConfigs(newConfigs);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="integer">Integer</option>
                              <option value="uuid">UUID</option>
                              <option value="string">String</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Context Key</label>
                            <select
                              value={tableConfig.userContextKey}
                              onChange={(e) => {
                                const newConfigs = new Map(tableConfigs);
                                newConfigs.set(tableName, { ...tableConfig, userContextKey: e.target.value });
                                setTableConfigs(newConfigs);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setView('select-tables')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleCreateAllTools}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Tools...
                  </>
                ) : (
                  `Create Tools (${selectedTables.size})`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Configured View */}
        {view === 'configured' && (
          <ToolsList
            tools={tools}
            loading={loading}
            onCreateTool={openCreateToolModal}
            onEditTool={openEditToolModal}
            onDeleteTool={handleDeleteTool}
            onDeleteConfig={handleDeleteConfig}
          />
        )}

        {/* Tool Modal */}
        <ToolModal
          isOpen={modal !== null}
          isEdit={modal === 'edit'}
          tables={tables}
          selectedTable={selectedTable}
          tableSchema={tableSchema}
          selectedColumns={selectedColumns}
          toolName={toolName}
          toolDescription={toolDescription}
          idColumn={idColumn}
          idColumnType={idColumnType}
          requiresUserContext={requiresUserContext}
          userFilterColumn={userFilterColumn}
          userFilterType={userFilterType}
          userContextKey={userContextKey}
          loadingSchema={loadingSchema}
          saving={saving}
          onClose={() => setModal(null)}
          onTableChange={handleTableSelect}
          onColumnToggle={handleColumnToggleModal}
          onToolNameChange={setToolName}
          onToolDescriptionChange={setToolDescription}
          onIdColumnChange={setIdColumn}
          onIdColumnTypeChange={setIdColumnType}
          onRequiresUserContextChange={setRequiresUserContext}
          onUserFilterColumnChange={setUserFilterColumn}
          onUserFilterTypeChange={setUserFilterType}
          onUserContextKeyChange={setUserContextKey}
          onSave={handleSaveTool}
        />

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </>
  );
}

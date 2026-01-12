import { useState, useEffect } from 'react';
import { Database, Plus, Trash2, AlertCircle, CheckCircle, Loader2, Eye, EyeOff, Edit2, X, Save, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useApp } from '@/contexts/AppContext';
import * as databaseToolsApi from '@/api/databaseTools';
import type { DatabaseConfig, DatabaseTool, TableColumn } from '@/api/databaseTools';

type View = 'loading' | 'setup' | 'select-tables' | 'configure-tools' | 'configured';
type Modal = 'create-tool' | 'edit-tool' | null;

export function DatabaseToolsTab() {
  const { token } = useApp();
  const [view, setView] = useState<View>('loading');
  const [modal, setModal] = useState<Modal>(null);
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

  // Create/Edit tool state
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
      // Load config and tools in parallel
      const [configResult, toolsResult] = await Promise.all([
        databaseToolsApi.getDatabaseConfig(token),
        databaseToolsApi.getDatabaseTools(token)
      ]);

      if (configResult.success && configResult.config) {
        setConfig(configResult.config);
        
        // Load tables if config is enabled
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
        // Ensure columns are parsed as arrays
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
    if (!token) {
      setError('Not authenticated');
      return;
    }

    if (!dbUrl || !dbKey) {
      setError('Please enter both Database URL and API Key');
      return;
    }

    setValidating(true);
    setValidationResult(null);
    setError(null);

    try {
      const result = await databaseToolsApi.validateDatabaseConnection(token, dbUrl, dbKey);
      
      if (result.success && result.valid && result.tables) {
        setValidationResult({ valid: true, tables: result.tables });
        setTables(result.tables);
        toast.success(`Connection validated! Found ${result.tables.length} tables.`, {
          duration: 5000,
        });
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
        
        // Load tables from the saved config
        if (validationResult?.tables) {
          setTables(validationResult.tables);
        } else {
          const tablesResult = await databaseToolsApi.getTablesFromConfig(token, result.config.id);
          if (tablesResult.success && tablesResult.tables) {
            setTables(tablesResult.tables);
          }
        }
        
        // Check if tools exist - if yes, go to configured view, else go to select tables
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
        
        toast.success('Database configuration saved!', {
          duration: 5000,
        });
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

    if (!confirm('Delete database configuration? This will remove all associated tools.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await databaseToolsApi.deleteDatabaseConfig(token, config.id);
      
      if (result.success) {
        // Clear ALL state to reset to fresh setup screen
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
        toast.success('Configuration deleted', {
          duration: 5000,
        });
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
      // Remove table
      newSelected.delete(tableName);
      const newConfigs = new Map(tableConfigs);
      newConfigs.delete(tableName);
      setTableConfigs(newConfigs);
    } else {
      // Add table and load schema
      newSelected.add(tableName);
      await loadTableSchemaForSelection(tableName);
    }
    
    setSelectedTables(newSelected);
  };

  const loadTableSchemaForSelection = async (tableName: string) => {
    if (!token || !config) return;

    // Check cache first
    if (schemaCache.has(tableName)) {
      const schema = schemaCache.get(tableName)!;
      const idCol = schema.find((c: TableColumn) => c.column_name === 'id' || c.column_name === 'uuid');
      
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
        
        // Cache the schema
        const newCache = new Map(schemaCache);
        newCache.set(tableName, schema);
        setSchemaCache(newCache);
        
        const idCol = schema.find((c: TableColumn) => c.column_name === 'id' || c.column_name === 'uuid');
        
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
      }
    } catch (err: any) {
      toast.error(`Failed to load schema for ${tableName}`, {
        duration: 5000,
      });
    } finally {
      setLoadingTables(prev => {
        const next = new Set(prev);
        next.delete(tableName);
        return next;
      });
    }
  };

  const handleColumnToggle = (tableName: string, columnName: string) => {
    const newConfigs = new Map(tableConfigs);
    const config = newConfigs.get(tableName);
    
    if (config) {
      const newColumns = new Set(config.columns);
      if (newColumns.has(columnName)) {
        newColumns.delete(columnName);
      } else {
        newColumns.add(columnName);
      }
      newConfigs.set(tableName, { ...config, columns: newColumns });
      setTableConfigs(newConfigs);
    }
  };

  const handleProceedToToolConfiguration = () => {
    if (selectedTables.size === 0) {
      setError('Please select at least one table');
      return;
    }
    
    // Validate that all selected tables have columns selected
    let hasError = false;
    for (const tableName of selectedTables) {
      const config = tableConfigs.get(tableName);
      if (!config || config.columns.size === 0) {
        setError(`Please select columns for table: ${tableName}`);
        hasError = true;
        break;
      }
    }
    
    if (!hasError) {
      setView('configure-tools');
    }
  };

  const handleCreateAllTools = async () => {
    if (!token || !config) return;

    setSaving(true);
    setError(null);

    try {
      const toolPromises = Array.from(selectedTables).map(async (tableName) => {
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
          user_filter_column: tableConfig.requiresUserContext ? tableConfig.userFilterColumn : undefined,
          user_filter_type: tableConfig.requiresUserContext ? tableConfig.userFilterType : undefined,
          user_context_key: tableConfig.requiresUserContext ? tableConfig.userContextKey : undefined,
        };

        return databaseToolsApi.createDatabaseTool(token, config.id, toolData);
      });

      const results = await Promise.all(toolPromises);
      const failed = results.filter(r => r && !r.success);

      if (failed.length > 0) {
        setError(`Failed to create ${failed.length} tool(s)`);
      } else {
        // Reload tools and go to configured view
        const toolsResult = await databaseToolsApi.getDatabaseTools(token);
        if (toolsResult.success && toolsResult.tools) {
          const parsedTools = toolsResult.tools.map(tool => ({
            ...tool,
            columns: typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns
          }));
          setTools(parsedTools);
        }
        
        // Reset selection state
        setSelectedTables(new Set());
        setTableConfigs(new Map());
        
        setView('configured');
        toast.success(`Successfully created ${selectedTables.size} tool(s)!`, {
          duration: 5000,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create tools');
    } finally {
      setSaving(false);
    }
  };

  const openCreateToolModal = () => {
    resetToolForm();
    setEditingTool(null);
    setModal('create-tool');
  };

  const openEditToolModal = (tool: DatabaseTool) => {
    setEditingTool(tool);
    setSelectedTable(tool.table_name);
    setToolName(tool.tool_name);
    setToolDescription(tool.tool_description || '');
    
    // Parse columns if needed
    const columns = typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns;
    setSelectedColumns(new Set(columns));
    
    setIdColumn(tool.id_column);
    setIdColumnType(tool.id_column_type);
    setRequiresUserContext(tool.requires_user_context || false);
    setUserFilterColumn(tool.user_filter_column || '');
    setUserFilterType(tool.user_filter_type || 'uuid');
    setUserContextKey(tool.user_context_key || 'user_uuid');
    setModal('edit-tool');
    
    // Load schema for the table
    if (config) {
      loadTableSchema(tool.table_name);
    }
  };

  const resetToolForm = () => {
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

  const closeModal = () => {
    setModal(null);
    setEditingTool(null);
    resetToolForm();
  };

  const loadTableSchema = async (tableName: string) => {
    if (!token || !config) return;

    setLoadingSchema(true);
    setError(null);

    try {
      const result = await databaseToolsApi.introspectTableColumns(token, config.id, tableName);
      
      if (result.success && result.schema) {
        setTableSchema(result.schema.columns);
        
        // Auto-select ID column if available
        const idCol = result.schema.columns.find((c: TableColumn) => c.column_name === 'id' || c.column_name === 'uuid');
        if (idCol && !idColumn) {
          setIdColumn(idCol.column_name);
          setIdColumnType(idCol.data_type === 'uuid' ? 'uuid' : idCol.data_type === 'integer' ? 'integer' : 'string');
        }
      } else {
        setError(result.error || 'Failed to load schema');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load schema');
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setSelectedColumns(new Set());
    setTableSchema([]);
    
    // Auto-generate tool name
    const sanitized = tableName.replace(/^vezlo_/, '').replace(/_/g, ' ');
    setToolName(`get_${tableName}`);
    setToolDescription(`Retrieve ${sanitized} data`);
    
    loadTableSchema(tableName);
  };

  const handleSaveTool = async () => {
    if (!token || !config) return;

    if (!selectedTable || selectedColumns.size === 0 || !toolName || !idColumn) {
      setError('Please fill all required fields');
      return;
    }

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
        user_filter_column: requiresUserContext ? userFilterColumn : undefined,
        user_filter_type: requiresUserContext ? userFilterType : undefined,
        user_context_key: requiresUserContext ? userContextKey : undefined,
      };

      const result = editingTool
        ? await databaseToolsApi.updateDatabaseTool(token, editingTool.id, toolData)
        : await databaseToolsApi.createDatabaseTool(token, config.id, toolData);

      if (result.success) {
        // Reload tools
        const toolsResult = await databaseToolsApi.getDatabaseTools(token);
        if (toolsResult.success && toolsResult.tools) {
          // Ensure columns are parsed as arrays
          const parsedTools = toolsResult.tools.map(tool => ({
            ...tool,
            columns: typeof tool.columns === 'string' ? JSON.parse(tool.columns) : tool.columns
          }));
          setTools(parsedTools);
        }



        
        toast.success(editingTool ? 'Tool updated!' : 'Tool created!', {
          duration: 5000,
        });
        closeModal();
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

    if (!confirm('Delete this tool? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await databaseToolsApi.deleteDatabaseTool(token, toolId);
      
      if (result.success) {
        setTools(tools.filter(t => t.id !== toolId));
        toast.success('Tool deleted', {
          duration: 5000,
        });
      } else {
        setError(result.error || 'Failed to delete tool');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete tool');
    } finally {
      setLoading(false);
    }
  };

  // Loading view
  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading database configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toast Container */}
      <Toaster 
        position="top-right"
        containerStyle={{
          top: 24,
          right: 24,
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Tools</h2>
        <p className="text-gray-600">Connect your external database (Supabase) and create AI-powered tools for seamless data access</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-600 hover:text-red-800 mt-1 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Setup View */}
      {view === 'setup' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Configuration</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Database URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Your Supabase project URL</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showDbKey ? 'text' : 'password'}
                  value={dbKey}
                  onChange={(e) => setDbKey(e.target.value)}
                  placeholder="your-supabase-service-role-key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowDbKey(!showDbKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showDbKey ? "Hide API key" : "Show API key"}
                >
                  {showDbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Service role key required (anon key will not work)
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleValidate}
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
                onClick={handleSaveConfig}
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
                  'Save Configuration'
                )}
              </button>
            )}
          </div>

          {validationResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              validationResult.valid 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {validationResult.valid ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <p className="font-medium text-emerald-900">Connection successful!</p>
                  </div>
                  <p className="text-sm text-emerald-800">
                    Found {validationResult.tables?.length || 0} tables. Click "Save Configuration" to continue.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="font-medium text-red-900">Connection failed</p>
                  </div>
                  <p className="text-sm text-red-800">{validationResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Select Tables View */}
      {view === 'select-tables' && (
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
                            onChange={() => handleTableToggle(tableName)}
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
                          <p className="text-sm font-medium text-gray-700 mb-3">Select columns to include:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {tableConfig.schema.map((col) => (
                              <label key={col.column_name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={tableConfig.columns.has(col.column_name)}
                                  onChange={() => handleColumnToggle(tableName, col.column_name)}
                                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-900">{col.column_name}</span>
                                <span className="text-xs text-gray-500">({col.data_type})</span>
                              </label>
                            ))}
                          </div>
                          {tableConfig.columns.size > 0 && (
                            <p className="text-xs text-gray-500 mt-2">{tableConfig.columns.size} column(s) selected</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedTables.size} table(s) selected
              </p>
              <button
                onClick={handleProceedToToolConfiguration}
                disabled={selectedTables.size === 0 || saving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Next: Configure Tools'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Tools View */}
      {view === 'configure-tools' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure AI Tools</h3>
              <p className="text-sm text-gray-600">Review and customize each tool before creating them</p>
            </div>

            <div className="space-y-6">
              {Array.from(selectedTables).map((tableName) => {
                const tableConfig = tableConfigs.get(tableName);
                if (!tableConfig) return null;

                return (
                  <div key={tableName} className="border border-gray-200 rounded-lg p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">{tableName}</h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Column</label>
                        <select
                          value={tableConfig.idColumn}
                          onChange={(e) => {
                            const newConfigs = new Map(tableConfigs);
                            newConfigs.set(tableName, { ...tableConfig, idColumn: e.target.value });
                            setTableConfigs(newConfigs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="">Choose...</option>
                          {tableConfig.schema.map((col) => (
                            <option key={col.column_name} value={col.column_name}>{col.column_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                        <select
                          value={tableConfig.idColumnType}
                          onChange={(e) => {
                            const newConfigs = new Map(tableConfigs);
                            newConfigs.set(tableName, { ...tableConfig, idColumnType: e.target.value as any });
                            setTableConfigs(newConfigs);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="integer">Integer</option>
                          <option value="uuid">UUID</option>
                          <option value="string">String</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        id={`user-filter-${tableName}`}
                        checked={tableConfig.requiresUserContext}
                        onChange={(e) => {
                          const newConfigs = new Map(tableConfigs);
                          newConfigs.set(tableName, { ...tableConfig, requiresUserContext: e.target.checked });
                          setTableConfigs(newConfigs);
                        }}
                        className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor={`user-filter-${tableName}`} className="text-gray-700 cursor-pointer">
                        Enable user-specific filtering
                      </label>
                    </div>

                    {tableConfig.requiresUserContext && (
                      <div className="grid grid-cols-3 gap-3 mt-3 ml-6">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Filter Column</label>
                          <select
                            value={tableConfig.userFilterColumn}
                            onChange={(e) => {
                              const newConfigs = new Map(tableConfigs);
                              newConfigs.set(tableName, { ...tableConfig, userFilterColumn: e.target.value });
                              setTableConfigs(newConfigs);
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Choose...</option>
                            {tableConfig.schema.map((col) => (
                              <option key={col.column_name} value={col.column_name}>{col.column_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Filter Type</label>
                          <select
                            value={tableConfig.userFilterType}
                            onChange={(e) => {
                              const newConfigs = new Map(tableConfigs);
                              newConfigs.set(tableName, { ...tableConfig, userFilterType: e.target.value as any });
                              setTableConfigs(newConfigs);
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="uuid">UUID</option>
                            <option value="integer">Integer</option>
                            <option value="string">String</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Context Key</label>
                          <select
                            value={tableConfig.userContextKey}
                            onChange={(e) => {
                              const newConfigs = new Map(tableConfigs);
                              newConfigs.set(tableName, { ...tableConfig, userContextKey: e.target.value });
                              setTableConfigs(newConfigs);
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="user_uuid">user_uuid</option>
                            <option value="user_id">user_id</option>
                            <option value="company_uuid">company_uuid</option>
                            <option value="company_id">company_id</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      {tableConfig.columns.size} column(s) selected
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between">
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
                  `Create ${selectedTables.size} Tool(s)`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configured View */}
      {view === 'configured' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connected Database</h3>
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Active connection</span>
                </div>
              </div>
              <button
                onClick={handleDeleteConfig}
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
          </div>

          {/* Tools List */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Database Tools</h3>
                <p className="text-sm text-gray-600">
                  {tools.length === 0 ? 'No tools configured yet' : `${tools.length} tool${tools.length !== 1 ? 's' : ''} configured`}
                </p>
              </div>
              <button
                onClick={openCreateToolModal}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"
                title="Create a new database tool for a specific table"
              >
                <Plus className="w-4 h-4 pointer-events-none" />
                Create Tool
              </button>
            </div>

            {tools.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1">No tools yet</p>
                <p className="text-sm text-gray-500">Create your first database tool to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{tool.tool_name}</h4>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {tool.table_name}
                          </span>
                          {tool.requires_user_context && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              User Filtered
                            </span>
                          )}
                        </div>
                        {tool.tool_description && (
                          <p className="text-sm text-gray-600 mb-3">{tool.tool_description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>📊 {Array.isArray(tool.columns) ? tool.columns.length : 0} column{Array.isArray(tool.columns) && tool.columns.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>🔑 ID: {tool.id_column} ({tool.id_column_type})</span>
                          {tool.requires_user_context && (
                            <>
                              <span>•</span>
                              <span>👤 Filter: {tool.user_filter_column} ({tool.user_context_key})</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openEditToolModal(tool)}
                          className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit this tool's configuration"
                        >
                          <Edit2 className="w-4 h-4 pointer-events-none" />
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this tool permanently"
                        >
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Tool Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTool ? 'Edit Tool' : 'Create New Tool'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close this modal"
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Table Selection */}
              {!editingTool && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Table <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => handleTableSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Choose a table...</option>
                    {tables.map((table) => (
                      <option key={table} value={table}>
                        {table}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTable && (
                <>
                  {/* Tool Name & Description */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        Tool Name <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 font-normal" title="The function name that the AI will call">
                          <Info className="w-3 h-3 inline" />
                        </span>
                      </label>
                      <input
                        type="text"
                        value={toolName}
                        onChange={(e) => setToolName(e.target.value)}
                        placeholder="get_user_details"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        Description
                        <span className="text-xs text-gray-500 font-normal" title="Help the AI understand when to use this tool">
                          <Info className="w-3 h-3 inline" />
                        </span>
                      </label>
                      <input
                        type="text"
                        value={toolDescription}
                        onChange={(e) => setToolDescription(e.target.value)}
                        placeholder="Retrieve user details"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Columns Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      Select Columns <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-500 font-normal" title="Choose which columns the AI can access from this table">
                        <Info className="w-3 h-3 inline" />
                      </span>
                    </label>
                    {loadingSchema ? (
                      <div className="flex items-center justify-center py-8 border border-gray-200 rounded-lg">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        <span className="ml-2 text-sm text-gray-500">Loading schema...</span>
                      </div>
                    ) : tableSchema.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                        {tableSchema.map((col) => (
                          <label key={col.column_name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedColumns.has(col.column_name)}
                              onChange={(e) => {
                                const newSet = new Set(selectedColumns);
                                if (e.target.checked) {
                                  newSet.add(col.column_name);
                                } else {
                                  newSet.delete(col.column_name);
                                }
                                setSelectedColumns(newSet);
                              }}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-900">{col.column_name}</span>
                            <span className="text-xs text-gray-500">({col.data_type})</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-4 text-center border border-gray-200 rounded-lg">
                        No schema available
                      </p>
                    )}
                    {selectedColumns.size > 0 && (
                      <p className="text-xs text-gray-500 mt-2">{selectedColumns.size} column(s) selected</p>
                    )}
                  </div>

                  {/* ID Column */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        ID Column <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 font-normal" title="Primary key column for this table">
                          <Info className="w-3 h-3 inline" />
                        </span>
                      </label>
                      <select
                        value={idColumn}
                        onChange={(e) => setIdColumn(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Choose...</option>
                        {tableSchema.map((col) => (
                          <option key={col.column_name} value={col.column_name}>
                            {col.column_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={idColumnType}
                        onChange={(e) => setIdColumnType(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="integer">Integer</option>
                        <option value="uuid">UUID</option>
                        <option value="string">String</option>
                      </select>
                    </div>
                  </div>

                  {/* User Context Filtering */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-start gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="requiresUserContext"
                        checked={requiresUserContext}
                        onChange={(e) => setRequiresUserContext(e.target.checked)}
                        className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <label htmlFor="requiresUserContext" className="block text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-1">
                          Enable User-Specific Filtering
                          <span className="text-xs text-gray-500 font-normal" title="Automatically filter data based on the logged-in user">
                            <Info className="w-3 h-3 inline" />
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Filter results based on user context passed from the widget (user_uuid, company_uuid, etc.)
                        </p>
                      </div>
                    </div>

                    {requiresUserContext && (
                      <div className="grid grid-cols-3 gap-4 ml-7">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter Column
                          </label>
                          <select
                            value={userFilterColumn}
                            onChange={(e) => setUserFilterColumn(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="">Choose...</option>
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
                            onChange={(e) => setUserFilterType(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="uuid">UUID</option>
                            <option value="integer">Integer</option>
                            <option value="string">String</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Context Key
                          </label>
                          <select
                            value={userContextKey}
                            onChange={(e) => setUserContextKey(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="user_uuid">user_uuid</option>
                            <option value="user_id">user_id</option>
                            <option value="company_uuid">company_uuid</option>
                            <option value="company_id">company_id</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTool}
                disabled={saving || !selectedTable || selectedColumns.size === 0 || !toolName || !idColumn}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingTool ? 'Update Tool' : 'Create Tool'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


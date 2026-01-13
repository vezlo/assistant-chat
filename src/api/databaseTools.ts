/**
 * Database Tools API Service
 * Handles external database tool configuration and management
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface DatabaseConfig {
  id: string;
  company_id: number;
  enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseTool {
  id: string;
  config_id: string;
  table_name: string;
  tool_name: string;
  tool_description: string;
  columns: string[];
  id_column: string;
  id_column_type: 'integer' | 'uuid' | 'string';
  enabled: boolean;
  requires_user_context?: boolean;
  user_filter_column?: string;
  user_filter_type?: 'integer' | 'uuid' | 'string';
  user_context_key?: string;
  created_at: string;
  updated_at?: string;
}

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export interface TableSchema {
  table_name: string;
  columns: TableColumn[];
}

const parseErrorMessage = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return (data as { error?: string; message?: string }).error || (data as { error?: string; message?: string }).message || 'Unexpected server error';
};

/**
 * Create a new database configuration
 */
export async function createDatabaseConfig(
  token: string,
  dbUrl: string,
  dbKey: string,
  apiUrl?: string
): Promise<{ success: boolean; config?: DatabaseConfig; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        db_url: dbUrl,
        db_key: dbKey,
      }),
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create configuration',
    };
  }
}

/**
 * Get current database configuration
 */
export async function getDatabaseConfig(
  token: string,
  apiUrl?: string
): Promise<{ success: boolean; config?: DatabaseConfig; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/config`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'No configuration found' };
      }
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get configuration',
    };
  }
}

/**
 * Update database configuration
 */
export async function updateDatabaseConfig(
  token: string,
  configId: string,
  dbUrl?: string,
  dbKey?: string,
  enabled?: boolean,
  apiUrl?: string
): Promise<{ success: boolean; config?: DatabaseConfig; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const updates: any = {};
    if (dbUrl) updates.db_url = dbUrl;
    if (dbKey) updates.db_key = dbKey;
    if (enabled !== undefined) updates.enabled = enabled;
    
    const response = await fetch(`${API_BASE_URL}/api/database-tools/config/${configId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update configuration',
    };
  }
}

/**
 * Delete database configuration
 */
export async function deleteDatabaseConfig(
  token: string,
  configId: string,
  apiUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/config/${configId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete configuration',
    };
  }
}

/**
 * Validate database connection
 */
export async function validateDatabaseConnection(
  token: string,
  dbUrl: string,
  dbKey: string,
  apiUrl?: string
): Promise<{ success: boolean; valid?: boolean; error?: string; tables?: string[] }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        db_url: dbUrl,
        db_key: dbKey,
      }),
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to validate connection',
    };
  }
}

/**
 * Get tables from existing config
 */
export async function getTablesFromConfig(
  token: string,
  configId: string,
  apiUrl?: string
): Promise<{ success: boolean; tables?: string[]; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/config/${configId}/tables`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get tables from config',
    };
  }
}

/**
 * Introspect table columns using configId
 */
export async function introspectTableColumns(
  token: string,
  configId: string,
  tableName: string,
  apiUrl?: string
): Promise<{ success: boolean; schema?: TableSchema; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/config/${configId}/tables/${tableName}/schema`, {
      method: 'GET',
      headers:
{
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to introspect table columns',
    };
  }
}

/**
 * Create a tool for a table
 */
export async function createDatabaseTool(
  token: string,
  configId: string,
  toolData: {
    table_name: string;
    tool_name: string;
    tool_description?: string;
    columns: string[];
    id_column: string;
    id_column_type: 'integer' | 'uuid' | 'string';
    requires_user_context?: boolean;
    user_filter_column?: string;
    user_filter_type?: 'integer' | 'uuid' | 'string';
    user_context_key?: string;
  },
  apiUrl?: string
): Promise<{ success: boolean; tool?: DatabaseTool; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        config_id: configId,
        ...toolData,
      }),
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create tool',
    };
  }
}

/**
 * Get all tools
 */
export async function getDatabaseTools(
  token: string,
  apiUrl?: string
): Promise<{ success: boolean; tools?: DatabaseTool[]; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/tools`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get tools',
    };
  }
}

/**
 * Update a tool
 */
export async function updateDatabaseTool(
  token: string,
  toolId: string,
  updates: {
    table_name?: string;
    tool_name?: string;
    tool_description?: string;
    columns?: string[];
    id_column?: string;
    id_column_type?: 'integer' | 'uuid' | 'string';
    enabled?: boolean;
    requires_user_context?: boolean;
    user_filter_column?: string;
    user_filter_type?: 'integer' | 'uuid' | 'string';
    user_context_key?: string;
  },
  apiUrl?: string
): Promise<{ success: boolean; tool?: DatabaseTool; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/tools/${toolId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update tool',
    };
  }
}

/**
 * Delete a tool
 */
export async function deleteDatabaseTool(
  token: string,
  toolId: string,
  apiUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-tools/tools/${toolId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await parseErrorMessage(response);
      return { success: false, error };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete tool',
    };
  }
}

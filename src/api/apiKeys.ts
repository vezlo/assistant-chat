const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface ApiKeyStatus {
  exists: boolean;
  uuid: string | null;
  message: string;
}

export interface ApiKeyResponse {
  success: boolean;
  uuid: string;
  api_key: string;
  message: string;
}

/**
 * Get API key status for authenticated company
 */
export async function getApiKeyStatus(
  token: string,
  apiUrl?: string
): Promise<ApiKeyStatus> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  
  const response = await fetch(`${API_BASE_URL}/api/api-keys/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get API key status' }));
    throw new Error(error.error || 'Failed to get API key status');
  }

  return await response.json();
}

/**
 * Generate or regenerate API key for authenticated company
 */
export async function generateApiKey(
  token: string,
  apiUrl?: string
): Promise<ApiKeyResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  
  const response = await fetch(`${API_BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate API key' }));
    throw new Error(error.error || 'Failed to generate API key');
  }

  return await response.json();
}

import { parseErrorMessage } from '../utils';

/**
 * Company API Service
 * Handles fetching company details and updating settings
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export type ResponseMode = 'user' | 'developer';

export interface Company {
  id: number;
  name: string;
  response_mode: ResponseMode;
  created_at: string;
  updated_at: string;
  // Add other fields as they become relevant
}

export interface UpdateCompanySettingsPayload {
  response_mode?: ResponseMode;
}

export async function getCompany(token: string, apiUrl?: string): Promise<Company> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/api/company`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return await response.json();
}

export async function updateCompanySettings(
  token: string,
  settings: UpdateCompanySettingsPayload,
  apiUrl?: string
): Promise<{ success: boolean }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/api/company`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return await response.json();
}


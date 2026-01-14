const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface AIPrompts {
  personality: string;
  response_guidelines: string;
  interaction_etiquette: string;
  scope_of_assistance: string;
  formatting_and_presentation: string;
}

export interface AISettings {
  model: string;
  temperature: number;
  max_tokens: number;
  top_k: number | null;
  prompts: AIPrompts;
}

/**
 * Get AI settings for a company
 */
export async function getAISettings(
  token: string,
  companyUuid: string,
  apiUrl?: string
): Promise<AISettings> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyUuid}/ai-settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to load AI settings' }));
    throw new Error(error.error || 'Failed to load AI settings');
  }

  const data = await response.json();
  return data.settings;
}

/**
 * Update AI settings for a company
 */
export async function updateAISettings(
  token: string,
  companyUuid: string,
  settings: Partial<AISettings>,
  apiUrl?: string
): Promise<AISettings> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  
  const response = await fetch(`${API_BASE_URL}/api/companies/${companyUuid}/ai-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update AI settings' }));
    throw new Error(error.error || 'Failed to update AI settings');
  }

  const data = await response.json();
  return data.settings;
}


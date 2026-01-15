const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface AccountProfile {
  uuid: string;
  user_uuid: string;
  email: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateAccountInput {
  name?: string;
  password?: string;
}

/**
 * Get current user's account profile
 */
export async function getAccountProfile(
  token: string,
  apiUrl?: string
): Promise<{ success: boolean; member: AccountProfile }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/api/account/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to load profile' }));
    throw new Error(error.error || 'Failed to load profile');
  }

  return await response.json();
}

/**
 * Update current user's account (name and password)
 */
export async function updateAccountProfile(
  token: string,
  input: UpdateAccountInput,
  apiUrl?: string
): Promise<{ success: boolean; member: AccountProfile; message: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/api/account/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update profile' }));
    throw new Error(error.error || 'Failed to update profile');
  }

  return await response.json();
}

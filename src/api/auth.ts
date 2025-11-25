/**
 * Auth API Service
 * Handles login, logout, and current user retrieval
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface MeResponse {
  user: {
    uuid: string;
    email: string;
    name: string;
  };
  profile: {
    uuid: string;
    company_uuid: string;
    company_name: string;
    role: string;
  };
}

const parseErrorMessage = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return (data as { error?: string; message?: string }).error || (data as { error?: string; message?: string }).message || 'Unexpected server error';
};

export async function loginUser(payload: LoginRequest, apiUrl?: string): Promise<LoginResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  const data = (await response.json()) as LoginResponse;
  if (!data.access_token) {
    throw new Error('Login succeeded but no access token was returned.');
  }
  return data;
}

export async function logoutUser(token: string, apiUrl?: string): Promise<void> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 401) {
    // 401 just means the token is already invalid – safe to continue
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }
}

export async function getCurrentUser(token: string, apiUrl?: string): Promise<MeResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new Error(message);
  }

  return (await response.json()) as MeResponse;
}



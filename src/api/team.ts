const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface TeamMember {
  uuid: string;
  user_uuid: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateTeamMemberInput {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

export interface UpdateTeamMemberInput {
  name?: string;
  role?: 'admin' | 'user' | 'viewer';
  status?: 'active' | 'inactive';
  password?: string;
}

export interface TeamMembersResponse {
  success: boolean;
  members: TeamMember[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get team members for a company
 */
export async function getTeamMembers(
  token: string,
  companyUuid: string,
  options?: { search?: string; page?: number; limit?: number },
  apiUrl?: string
): Promise<TeamMembersResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const params = new URLSearchParams();
  if (options?.search) params.append('search', options.search);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await fetch(`${API_BASE_URL}/api/companies/${companyUuid}/team?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to load team members' }));
    throw new Error(error.error || 'Failed to load team members');
  }

  return await response.json();
}

/**
 * Create a new team member
 */
export async function createTeamMember(
  token: string,
  companyUuid: string,
  input: CreateTeamMemberInput,
  apiUrl?: string
): Promise<{ success: boolean; member: TeamMember; message: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/api/companies/${companyUuid}/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create team member' }));
    throw new Error(error.error || 'Failed to create team member');
  }

  return await response.json();
}

/**
 * Update a team member
 */
export async function updateTeamMember(
  token: string,
  companyUuid: string,
  userUuid: string,
  input: UpdateTeamMemberInput,
  apiUrl?: string
): Promise<{ success: boolean; member: TeamMember; message: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/api/companies/${companyUuid}/team/${userUuid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update team member' }));
    throw new Error(error.error || 'Failed to update team member');
  }

  return await response.json();
}

/**
 * Delete a team member
 */
export async function deleteTeamMember(
  token: string,
  companyUuid: string,
  userUuid: string,
  apiUrl?: string
): Promise<{ success: boolean; message: string }> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;

  const response = await fetch(`${API_BASE_URL}/api/companies/${companyUuid}/team/${userUuid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete team member' }));
    throw new Error(error.error || 'Failed to delete team member');
  }

  return await response.json();
}

/**
 * Analytics API Service
 * Handles fetching company analytics data
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface CompanyAnalyticsResponse {
  conversations: {
    total: number;
    open: number;
    closed: number;
  };
  users: {
    total_active_users: number;
  };
  messages: {
    total: number;
    user_messages_total: number;
    assistant_messages_total: number;
    agent_messages_total: number;
  };
  feedback: {
    total: number;
    likes: number;
    dislikes: number;
  };
}

const parseErrorMessage = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return (
    (data as { error?: string; message?: string }).error ||
    (data as { error?: string; message?: string }).message ||
    'Unexpected server error'
  );
};

export async function getCompanyAnalytics(token: string, apiUrl?: string): Promise<CompanyAnalyticsResponse> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const response = await fetch(`${API_BASE_URL}/api/company/analytics`, {
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

  return (await response.json()) as CompanyAnalyticsResponse;
}


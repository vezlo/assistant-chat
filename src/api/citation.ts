/**
 * Citation API Service
 */

const DEFAULT_API_BASE_URL = import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000';

export interface CitationContext {
  document_title: string;
  document_type: string;
  file_type?: string;
  content: string;
}

export async function getCitationContext(
  documentUuid: string,
  chunkIndices: number[],
  apiUrl?: string
): Promise<CitationContext> {
  const API_BASE_URL = apiUrl || DEFAULT_API_BASE_URL;
  const indicesParam = chunkIndices.join(',');
  
  const response = await fetch(
    `${API_BASE_URL}/api/knowledge/citations/${documentUuid}/context?chunk_indices=${indicesParam}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch citation context');
  }

  return await response.json();
}


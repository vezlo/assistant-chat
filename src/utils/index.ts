import { clsx, type ClassValue } from 'clsx';

// Utility function for conditional CSS classes
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Format timestamp
export function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Validate widget configuration
export function validateWidgetConfig(config: any): boolean {
  return (
    config &&
    typeof config.uuid === 'string' &&
    typeof config.apiUrl === 'string' &&
    typeof config.apiKey === 'string' &&
    typeof config.title === 'string'
  );
}

// Parse size string (e.g., "350x500") to object
export function parseSize(sizeString: string): { width: number; height: number } {
  const [width, height] = sizeString.split('x').map(Number);
  return {
    width: width || 350,
    height: height || 500
  };
}

// Get environment configuration
export function getEnvConfig() {
  return {
    VITE_ASSISTANT_SERVER_URL: import.meta.env.VITE_ASSISTANT_SERVER_URL || 'http://localhost:3000',
    VITE_ASSISTANT_SERVER_API_KEY: import.meta.env.VITE_ASSISTANT_SERVER_API_KEY || '',
    VITE_DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
    VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true'
  };
}

// Debug logging
export function debugLog(message: string, data?: any) {
  if (getEnvConfig().VITE_DEBUG_MODE) {
    console.log(`[VezloChat] ${message}`, data);
  }
}

// Helper to parse error messages from API responses
export const parseErrorMessage = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  return (data as { error?: string; message?: string }).error || (data as { error?: string; message?: string }).message || 'Unexpected server error';
};


/**
 * Production environment detection and API URL resolution.
 */
const getBackendUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  
  // Default fallback for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  return window.location.origin;
};

export const API_BASE_URL = getBackendUrl();

export const SOCKET_URL = API_BASE_URL.replace(/^http/, 'ws');

export const APP_NAME = 'Clientify';

export const INITIAL_METRICS = [
  { label: 'Total Clients', value: 0, trend: 'stable' as const },
  { label: 'Active Cases', value: 0, trend: 'stable' as const },
  { label: 'Outstanding Fees', value: 0, trend: 'stable' as const },
  { label: 'Firm Backlog', value: 0, trend: 'stable' as const },
];

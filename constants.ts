// Detect current environment
const isProd = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

/**
 * Production environment variables for Cloud Vault.
 */
const BACKEND_URL_ENV = (import.meta as any).env?.VITE_BACKEND_URL;

export const API_BASE_URL = BACKEND_URL_ENV 
  ? BACKEND_URL_ENV.replace(/\/$/, '') 
  : (isProd ? '' : 'http://localhost:3001');

export const SOCKET_URL = BACKEND_URL_ENV
  ? BACKEND_URL_ENV.replace(/^http/, 'ws')
  : (isProd ? `wss://${window.location.host}` : 'ws://localhost:3001');

export const INITIAL_METRICS = [
  { label: 'Total Clients', value: 0, trend: 'stable' as const },
  { label: 'Active Cases', value: 0, trend: 'stable' as const },
  { label: 'Outstanding Fees', value: 0, trend: 'stable' as const },
  { label: 'Firm Backlog', value: 0, trend: 'stable' as const },
];

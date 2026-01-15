// Detect current environment
// Fix: Use optional chaining to prevent crash if env is undefined
const isProd = (import.meta as any).env?.PROD || false;

/**
 * Production environment variables for Cloud Vault.
 * Vite requires 'import.meta.env' for variables starting with VITE_
 */
// Fix: Use optional chaining to prevent crash if env is undefined
const BACKEND_URL_ENV = (import.meta as any).env?.VITE_BACKEND_URL;

// If the user hasn't configured a backend, we default to relative paths
// On Netlify, this requires VITE_BACKEND_URL to be set to your actual server
export const API_BASE_URL = BACKEND_URL_ENV 
  ? BACKEND_URL_ENV.replace(/\/$/, '') 
  : '';

export const SOCKET_URL = BACKEND_URL_ENV
  ? BACKEND_URL_ENV.replace(/^http/, 'ws')
  : (isProd ? `wss://${window.location.host}` : 'ws://localhost:3001');

export const INITIAL_METRICS = [
  { label: 'Total Clients', value: 0, trend: 'stable' as const },
  { label: 'Active Cases', value: 0, trend: 'stable' as const },
  { label: 'Outstanding Fees', value: 0, trend: 'stable' as const },
  { label: 'Firm Backlog', value: 0, trend: 'stable' as const },
];

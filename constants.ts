
// Use the environment variable set in Netlify (e.g., https://clientify-api.onrender.com)
// If not set, it defaults to localhost for development.
const BACKEND_URL_ENV = (import.meta as any).env?.VITE_BACKEND_URL;

export const API_BASE_URL = BACKEND_URL_ENV 
  ? BACKEND_URL_ENV.replace(/\/$/, '') 
  : 'http://localhost:3001';

export const SOCKET_URL = API_BASE_URL.replace(/^http/, 'ws');

export const INITIAL_METRICS = [
  { label: 'Cloud Vault Active', value: 0, trend: 'stable' },
  { label: 'GST Sync Pending', value: 0, trend: 'stable' },
  { label: 'ITR AY Progress', value: 0, trend: 'stable' },
  { label: 'Active Litigation', value: 0, trend: 'stable' },
];

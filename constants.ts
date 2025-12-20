
// Detect current environment
const isProd = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

/**
 * For Netlify (Frontend) + Render (Backend) setup:
 * You MUST set VITE_BACKEND_URL in your Netlify Environment Variables.
 * Example: https://clientify-api.onrender.com
 */
const BACKEND_URL_ENV = (import.meta as any).env?.VITE_BACKEND_URL;

// Base configuration
// If we have an ENV var, use it. Otherwise, in dev use localhost.
// In production without an ENV var, we use an empty string to allow relative calls (if applicable)
export const API_BASE_URL = BACKEND_URL_ENV 
  ? BACKEND_URL_ENV.replace(/\/$/, '') 
  : (isProd ? '' : 'http://localhost:3001');

// Socket URL needs to handle wss:// for production
export const SOCKET_URL = BACKEND_URL_ENV
  ? BACKEND_URL_ENV.replace(/^http/, 'ws')
  : (isProd ? `wss://${window.location.host}` : 'ws://localhost:3001');

export const INITIAL_METRICS = [
  { label: 'Active Clients', value: 0, trend: 'stable' },
  { label: 'GST Filings Due', value: 0, trend: 'stable' },
  { label: 'ITR Progress', value: 0, trend: 'stable' },
  { label: 'Pending Documents', value: 0, trend: 'stable' },
];

export const MOCK_USERS = [
  { id: '1', username: 'ca_sharma', status: 'online' },
  { id: '2', username: 'tax_expert_anil', status: 'away' },
  { id: '3', username: 'gst_pro_neha', status: 'online' },
];

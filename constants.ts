
// Use separate variables for HTTP and WebSocket to avoid protocol mismatch
const BASE_HOST = (import.meta as any).env?.VITE_BACKEND_URL || 'localhost:3001';

// Ensure the protocol is correct for the transport type
export const API_BASE_URL = BASE_HOST.startsWith('http') 
  ? BASE_HOST 
  : `http://${BASE_HOST}`;

export const SOCKET_URL = BASE_HOST.startsWith('ws') 
  ? BASE_HOST 
  : `ws://${BASE_HOST.replace(/^https?:\/\//, '')}`;

export const INITIAL_METRICS = [
  { label: 'Active Clients', value: 42, trend: 'up' },
  { label: 'GST Filings Due', value: 12, trend: 'down' },
  { label: 'ITR Progress', value: 78, trend: 'up' },
  { label: 'Pending Documents', value: 24, trend: 'stable' },
];

export const MOCK_USERS = [
  { id: '1', username: 'ca_sharma', status: 'online' },
  { id: '2', username: 'tax_expert_anil', status: 'away' },
  { id: '3', username: 'gst_pro_neha', status: 'online' },
];
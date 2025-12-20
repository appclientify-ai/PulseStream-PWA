
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
  { label: 'Network Latency', value: 24, trend: 'stable' },
  { label: 'Active Sessions', value: 120, trend: 'up' },
  { label: 'Throughput', value: 850, trend: 'up' },
  { label: 'Error Rate', value: 0.02, trend: 'down' },
];

export const MOCK_USERS = [
  { id: '1', username: 'alex_dev', status: 'online' },
  { id: '2', username: 'sarah_ops', status: 'away' },
  { id: '3', username: 'mike_qa', status: 'online' },
];

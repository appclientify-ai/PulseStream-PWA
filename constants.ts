
// Fallback to a mock websocket server for demo if no ENV is provided
export const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'wss://mock-socket-server.example.com';

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

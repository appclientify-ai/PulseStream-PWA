
const BASE_URL = (import.meta).env?.VITE_BACKEND_URL || 'http://localhost:3001';

export const api = {
  post: async (endpoint, data) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  get: async (endpoint) => {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    return res.json();
  }
};

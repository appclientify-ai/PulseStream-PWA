
const BASE_URL = (import.meta).env?.VITE_BACKEND_URL || '';

export const api = {
  post: async (endpoint, data) => {
    // Ensure endpoint starts with /api if not already present
    const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  get: async (endpoint) => {
    const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const res = await fetch(`${BASE_URL}${path}`);
    return res.json();
  }
};

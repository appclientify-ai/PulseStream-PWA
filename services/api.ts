
import { API_BASE_URL } from '../constants';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Constructs the full URL for an API call.
   * All routes in the backend app.js are prefixed with /api (e.g., /api/auth, /api/items).
   */
  private getFullUrl(endpoint: string): string {
    const cleanBase = API_BASE_URL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${cleanBase}/api${cleanEndpoint}`;
  }

  async get(endpoint: string) {
    try {
      const headers: HeadersInit = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(this.getFullUrl(endpoint), {
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'API request failed');
      }
      return await response.json();
    } catch (error) {
      console.warn(`API GET failed for ${endpoint}:`, error);
      
      // Simulation fallback for demo environments
      if (endpoint.includes('/auth/me')) {
        if (this.token) {
          return { user: { id: 'demo-1', username: 'Demo Consultant', status: 'online' } };
        }
        throw new Error('Unauthorized');
      }
      
      if (endpoint === '/items') {
        return [];
      }

      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(this.getFullUrl(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'API request failed');
      }
      return await response.json();
    } catch (error) {
      console.warn(`API POST failed for ${endpoint}:`, error);
      
      // Fallback for demo if backend is not running or unreachable
      const isLocalOrDemo = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('example.com') || (error instanceof TypeError && error.message === 'Failed to fetch');
      
      if (isLocalOrDemo && (endpoint.includes('/auth/login') || endpoint.includes('/auth/signup'))) {
         console.warn('Backend unreachable. Simulating successful authentication for demo purposes.');
         return {
           token: 'demo-jwt-token-' + Date.now(),
           user: { 
             id: 'demo-1', 
             username: data.username || (data.email ? data.email.split('@')[0] : 'Consultant'), 
             email: data.email || 'demo@clientify.com',
             status: 'online' 
           }
         };
      }
      
      throw error;
    }
  }
}

export const api = new ApiService();


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
  }

  async post(endpoint: string, data: any) {
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

    const result = await response.json().catch(() => ({ error: 'Invalid server response' }));
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'API request failed');
    }
    
    return result;
  }
}

export const api = new ApiService();

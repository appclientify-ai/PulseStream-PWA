import { BACKEND_URL } from '../constants';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async get(endpoint: string) {
    try {
      const headers: HeadersInit = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
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

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}

export const api = new ApiService();

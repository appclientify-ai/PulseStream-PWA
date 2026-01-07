
import { API_BASE_URL } from '../constants';

class ApiService {
  private token: string | null = null;
  public isMockMode: boolean = false;

  setToken(token: string | null) {
    this.token = token;
    // Persist token in cookie or localStorage for PWA reliability
    if (token) {
      localStorage.setItem('clientify_token', token);
    } else {
      localStorage.removeItem('clientify_token');
    }
  }

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}/api${cleanEndpoint}`;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      this.setToken(null);
      return null;
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // If we get HTML back (likely a Netlify 404 redirect), treat as error
      throw new Error(`Server returned non-JSON response (${response.status}). Check VITE_BACKEND_URL.`);
    }

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || 'Request failed');
    return result;
  }

  async get(endpoint: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
    try {
      const res = await fetch(this.getFullUrl(endpoint), { method: 'GET', headers });
      return await this.handleResponse(res);
    } catch (err) {
      console.error(`API GET ${endpoint} failed:`, err);
      throw err;
    }
  }

  async post(endpoint: string, data: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
    try {
      const res = await fetch(this.getFullUrl(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return await this.handleResponse(res);
    } catch (err) {
      console.error(`API POST ${endpoint} failed:`, err);
      throw err;
    }
  }

  async put(endpoint: string, data: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
    const res = await fetch(this.getFullUrl(endpoint), {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async delete(endpoint: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
    const res = await fetch(this.getFullUrl(endpoint), { method: 'DELETE', headers });
    return this.handleResponse(res);
  }
}

export const api = new ApiService();


import { API_BASE_URL } from '../constants';

class ApiService {
  private token: string | null = null;
  // Increased delay to 1200ms to ensure a "calm" UI transition as requested
  private minDelay = 1200; 

  setToken(token: string | null) {
    this.token = token;
  }

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Safety check for production environments
    if (!API_BASE_URL && window.location.hostname !== 'localhost') {
        // We log it as a warning instead of a fatal error because some setups 
        // might use redirects or proxies at the host level.
        console.warn('VITE_BACKEND_URL is not set. API calls will be relative to the current host.');
    }
    
    return `${API_BASE_URL}/api${cleanEndpoint}`;
  }

  /**
   * Helper to ensure a minimum execution time for any async task
   */
  private async withMinDelay<T>(task: Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await task;
      const elapsed = Date.now() - start;
      if (elapsed < this.minDelay) {
        await new Promise(resolve => setTimeout(resolve, this.minDelay - elapsed));
      }
      return result;
    } catch (error) {
      // Even on error, we wait a bit so the error doesn't "pop" in too aggressively
      const elapsed = Date.now() - start;
      if (elapsed < this.minDelay) {
        await new Promise(resolve => setTimeout(resolve, this.minDelay - elapsed));
      }
      throw error;
    }
  }

  async get(endpoint: string) {
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return this.withMinDelay(
      fetch(this.getFullUrl(endpoint), { method: 'GET', headers })
        .then(res => this.handleResponse(res))
    );
  }

  async post(endpoint: string, data: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return this.withMinDelay(
      fetch(this.getFullUrl(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }).then(res => this.handleResponse(res))
    );
  }

  private async handleResponse(response: Response) {
    const responseText = await response.text();
    let result;
    
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Server response was not JSON:', responseText.substring(0, 100));
      throw new Error(`Invalid server response (${response.status}). The server might be down or misconfigured.`);
    }
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Request failed with status ${response.status}`);
    }
    
    return result;
  }
}

export const api = new ApiService();

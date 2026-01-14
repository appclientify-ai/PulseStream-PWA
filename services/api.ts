
import { API_BASE_URL } from '../constants.ts';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const apiPath = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
    
    // Ensure we are hitting the correct backend URL
    const baseUrl = API_BASE_URL || window.location.origin;
    return `${baseUrl}${apiPath}`;
  }

  private async handleResponse(response: Response) {
    // If unauthorized, clear session
    if (response.status === 401) {
      document.cookie = 'clientify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.reload();
      throw new Error('Session Expired');
    }

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    
    if (!isJson) {
      const text = await response.text();
      console.error('Non-JSON Response:', text.substring(0, 300));
      throw new Error(`The server returned an invalid format (Status ${response.status}). Please check VITE_BACKEND_URL.`);
    }

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || result.error || 'Vault Access Denied');
    return result;
  }

  async get(endpoint: string) {
    const headers: HeadersInit = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const res = await fetch(this.getFullUrl(endpoint), { method: 'GET', headers });
    return this.handleResponse(res);
  }

  async post(endpoint: string, data: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
    const res = await fetch(this.getFullUrl(endpoint), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  // Fix: Added put method for updating records
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

  // Fix: Added delete method for removing records
  async delete(endpoint: string) {
    const headers: HeadersInit = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const res = await fetch(this.getFullUrl(endpoint), { method: 'DELETE', headers });
    return this.handleResponse(res);
  }

  // Domain Specific Methods
  
  // Fix: Implemented getClients to fetch and filter client items
  async getClients() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'client').map((i: any) => ({ ...i.data, id: i._id }));
  }

  // Fix: Implemented saveClient to handle both create and update for clients
  async saveClient(client: any) {
    const payload = { name: 'client', data: client };
    return client.id 
      ? await this.put(`/items/${client.id}`, payload)
      : await this.post('/items', payload);
  }

  // Fix: Implemented deleteClient for client removal
  async deleteClient(id: string) {
    return await this.delete(`/items/${id}`);
  }

  // Fix: Implemented getDashboardSummary to fetch and categorize all practice data
  async getDashboardSummary() {
    const items = await this.get('/items');
    return {
      clients: items.filter((i: any) => i.name === 'client').map((i: any) => ({ ...i.data, id: i._id })),
      invoices: items.filter((i: any) => i.name === 'invoice').map((i: any) => ({ ...i.data, id: i._id })),
      litigation: items.filter((i: any) => i.name === 'litigation').map((i: any) => ({ ...i.data, id: i._id })),
      work: items.filter((i: any) => i.name === 'misc_work').map((i: any) => ({ ...i.data, id: i._id })),
    };
  }

  // Fix: Implemented updateProfile to sync practitioner details with backend
  async updateProfile(data: any) {
    return await this.put('/auth/update', data);
  }

  // Fix: Implemented billing methods for invoice management
  async getInvoices() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'invoice').map((i: any) => ({ ...i.data, id: i._id }));
  }

  async saveInvoice(invoice: any) {
    const payload = { name: 'invoice', data: invoice };
    return invoice.id 
      ? await this.put(`/items/${invoice.id}`, payload)
      : await this.post('/items', payload);
  }

  async getInvoiceSettings() {
    const items = await this.get('/items');
    const settings = items.find((i: any) => i.name === 'invoice_settings');
    return settings ? settings.data : {
      firmName: '', firmAddress: '', firmMobile: '', firmEmail: '', firmGstin: '',
      bankName: '', accountNo: '', ifsc: '', upiId: '', invoicePrefix: 'INV/',
      terms: '', isGstEnabled: true
    };
  }

  async saveInvoiceSettings(settings: any) {
    const items = await this.get('/items');
    const existing = items.find((i: any) => i.name === 'invoice_settings');
    const payload = { name: 'invoice_settings', data: settings };
    return existing 
      ? await this.put(`/items/${existing._id}`, payload)
      : await this.post('/items', payload);
  }

  async generateNextInvoiceNo() {
    const invoices = await this.getInvoices();
    const settings = await this.getInvoiceSettings();
    const prefix = settings.invoicePrefix || 'INV/';
    return `${prefix}${invoices.length + 1}`;
  }

  async getPayments() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'payment').map((i: any) => ({ ...i.data, id: i._id }));
  }

  async migrateToPayment(invoiceId: string, paymentData: any) {
    const items = await this.get('/items');
    const invoiceItem = items.find((i: any) => i._id === invoiceId);
    if (!invoiceItem) return;

    await this.post('/items', {
      name: 'payment',
      data: {
        invoiceNo: invoiceItem.data.invoiceNo,
        clientName: invoiceItem.data.clientName,
        clientId: invoiceItem.data.clientId,
        amount: invoiceItem.data.totalAmount,
        ...paymentData
      }
    });

    await this.put(`/items/${invoiceId}`, {
      name: 'invoice',
      data: { ...invoiceItem.data, status: 'Paid' }
    });
  }

  // Fix: Implemented litigation methods for notice/appeal tracking
  async getLitigationRecords() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'litigation').map((i: any) => ({ ...i.data, id: i._id }));
  }

  async saveLitigationRecord(record: any) {
    const payload = { name: 'litigation', data: record };
    return record.id 
      ? await this.put(`/items/${record.id}`, payload)
      : await this.post('/items', payload);
  }

  // Fix: Implemented miscellaneous registration methods
  async getGSTRegistrations() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'gst_registration').map((i: any) => ({ ...i.data, id: i._id }));
  }
  async saveGSTRegistration(data: any) {
    const payload = { name: 'gst_registration', data };
    return data.id ? await this.put(`/items/${data.id}`, payload) : await this.post('/items', payload);
  }
  async deleteGSTRegistration(id: string) { return await this.delete(`/items/${id}`); }

  async getFoodLicenses() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'food_license').map((i: any) => ({ ...i.data, id: i._id }));
  }
  async saveFoodLicense(data: any) {
    const payload = { name: 'food_license', data };
    return data.id ? await this.put(`/items/${data.id}`, payload) : await this.post('/items', payload);
  }
  async deleteFoodLicense(id: string) { return await this.delete(`/items/${id}`); }

  async getMSMERegistrations() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'msme_registration').map((i: any) => ({ ...i.data, id: i._id }));
  }
  async saveMSMERegistration(data: any) {
    const payload = { name: 'msme_registration', data };
    return data.id ? await this.put(`/items/${data.id}`, payload) : await this.post('/items', payload);
  }
  async deleteMSMERegistration(id: string) { return await this.delete(`/items/${id}`); }

  async getMiscWork() {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'misc_work').map((i: any) => ({ ...i.data, id: i._id }));
  }
  async saveMiscWork(data: any) {
    const payload = { name: 'misc_work', data };
    return data.id ? await this.put(`/items/${data.id}`, payload) : await this.post('/items', payload);
  }
  async deleteMiscWork(id: string) { return await this.delete(`/items/${id}`); }

  // Fix: Implemented data backup and restore methods
  async backupAllData() {
    const items = await this.get('/items');
    return JSON.stringify(items);
  }

  async restoreData(items: any[]) {
    for (const item of items) {
      await this.post('/items', { name: item.name, data: item.data });
    }
  }
}

export const api = new ApiService();

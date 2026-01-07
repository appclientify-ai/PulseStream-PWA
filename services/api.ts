
import { API_BASE_URL } from '../constants.ts';
import { Client, LitigationRecord, InvoiceRecord, PaymentRecord, InvoiceSettings, GSTRegistrationRecord, FoodLicenseRecord, MSMERegistrationRecord, MiscWorkRecord } from '../types.ts';

class ApiService {
  private token: string | null = null;
  public isMockMode = false; // Always false for production

  setToken(token: string | null) {
    this.token = token;
  }

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}/api${cleanEndpoint}`;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Handle unauthorized (token expired)
      document.cookie = 'clientify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.reload();
    }
    const responseText = await response.text();
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      throw new Error(`Invalid server response (${response.status})`);
    }
    if (!response.ok) throw new Error(result.message || result.error || 'Request failed');
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

  // --- Domain Logic Mapped to /api/items ---

  private transformItem(item: any) {
    return {
      ...item.data,
      id: item._id, // Map MongoDB _id to frontend id
      createdAt: item.createdAt
    };
  }

  async getClients(): Promise<Client[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'client').map(this.transformItem);
  }

  async saveClient(client: Partial<Client>): Promise<Client> {
    const payload = {
      name: 'client',
      data: { ...client }
    };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getLitigationRecords(): Promise<LitigationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'litigation').map(this.transformItem);
  }

  async saveLitigationRecord(record: Partial<LitigationRecord>): Promise<LitigationRecord> {
    const payload = {
      name: 'litigation',
      data: { ...record }
    };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getInvoices(): Promise<InvoiceRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'invoice').map(this.transformItem);
  }

  async saveInvoice(invoice: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
    const payload = {
      name: 'invoice',
      data: { ...invoice }
    };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getPayments(): Promise<PaymentRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'payment').map(this.transformItem);
  }

  async savePayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const payload = {
      name: 'payment',
      data: { ...payment }
    };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    const items = await this.get('/items');
    const set = items.find((i: any) => i.name === 'invoice_settings');
    if (set) return this.transformItem(set);
    return {
      firmName: 'Your Firm Name',
      firmAddress: '',
      firmMobile: '',
      firmEmail: '',
      firmGstin: '',
      invoicePrefix: 'INV/',
      bankName: '',
      accountNo: '',
      ifsc: '',
      upiId: '',
      terms: '',
      isGstEnabled: true
    };
  }

  async saveInvoiceSettings(settings: InvoiceSettings): Promise<void> {
    const payload = {
      name: 'invoice_settings',
      data: settings
    };
    await this.post('/items', payload);
  }

  async getGSTRegistrations(): Promise<GSTRegistrationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'gst_reg').map(this.transformItem);
  }

  async saveGSTRegistration(reg: Partial<GSTRegistrationRecord>): Promise<GSTRegistrationRecord> {
    const payload = { name: 'gst_reg', data: reg };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getFoodLicenses(): Promise<FoodLicenseRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'food_lic').map(this.transformItem);
  }

  async saveFoodLicense(lic: Partial<FoodLicenseRecord>): Promise<FoodLicenseRecord> {
    const payload = { name: 'food_lic', data: lic };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getMSMERegistrations(): Promise<MSMERegistrationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'msme').map(this.transformItem);
  }

  async saveMSMERegistration(reg: Partial<MSMERegistrationRecord>): Promise<MSMERegistrationRecord> {
    const payload = { name: 'msme', data: reg };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getMiscWork(): Promise<MiscWorkRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'misc_work').map(this.transformItem);
  }

  async saveMiscWork(work: Partial<MiscWorkRecord>): Promise<MiscWorkRecord> {
    const payload = { name: 'misc_work', data: work };
    const res = await this.post('/items', payload);
    return this.transformItem(res);
  }
}

export const api = new ApiService();

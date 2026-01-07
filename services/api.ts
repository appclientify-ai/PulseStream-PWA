
import { API_BASE_URL } from '../constants.ts';
import { Client, LitigationRecord, InvoiceRecord, PaymentRecord, InvoiceSettings, GSTRegistrationRecord, FoodLicenseRecord, MSMERegistrationRecord, MiscWorkRecord } from '../types.ts';

class ApiService {
  private token: string | null = null;
  public isMockMode = false;

  setToken(token: string | null) {
    this.token = token;
    if (token) api.get('/auth/me').catch(() => this.setToken(null));
  }

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}/api${cleanEndpoint}`;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
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
    const headers: HeadersInit = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const res = await fetch(this.getFullUrl(endpoint), { method: 'DELETE', headers });
    return this.handleResponse(res);
  }

  // --- Helpers ---
  private transformItem(item: any) {
    if (!item) return null;
    return {
      ...item.data,
      id: item._id, 
      createdAt: item.createdAt
    };
  }

  // --- Domain Logic Mapped to /api/items ---

  async getClients(): Promise<Client[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'client').map(this.transformItem);
  }

  async saveClient(client: Partial<Client>): Promise<Client> {
    const payload = { name: 'client', data: { ...client } };
    const res = client.id 
      ? await this.put(`/items/${client.id}`, payload)
      : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async deleteClient(id: string): Promise<void> {
    await this.delete(`/items/${id}`);
  }

  async getLitigationRecords(): Promise<LitigationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'litigation').map(this.transformItem);
  }

  async saveLitigationRecord(record: Partial<LitigationRecord>): Promise<LitigationRecord> {
    const payload = { name: 'litigation', data: { ...record } };
    const res = record.id 
      ? await this.put(`/items/${record.id}`, payload)
      : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async getInvoices(): Promise<InvoiceRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'invoice').map(this.transformItem);
  }

  async saveInvoice(invoice: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
    const payload = { name: 'invoice', data: { ...invoice } };
    const res = invoice.id 
      ? await this.put(`/items/${invoice.id}`, payload)
      : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async generateNextInvoiceNo(): Promise<string> {
    const invs = await this.getInvoices();
    const sets = await this.getInvoiceSettings();
    const prefix = sets.invoicePrefix || 'INV/';
    const count = invs.length + 1;
    return `${prefix}${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${count.toString().padStart(3, '0')}`;
  }

  async getPayments(): Promise<PaymentRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'payment').map(this.transformItem);
  }

  async savePayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const payload = { name: 'payment', data: { ...payment } };
    const res = payment.id 
      ? await this.put(`/items/${payment.id}`, payload)
      : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async migrateToPayment(invoiceId: string, paymentData: any): Promise<void> {
    const invs = await this.getInvoices();
    const inv = invs.find(i => i.id === invoiceId);
    if (!inv) return;

    await this.savePayment({
      clientId: inv.clientId,
      clientName: inv.clientName,
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.date,
      amount: inv.totalAmount,
      date: paymentData.date,
      mode: paymentData.mode,
      chequeNo: paymentData.chequeNo,
      originalItems: inv.items
    });

    await this.saveInvoice({ ...inv, status: 'Paid' });
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
    const existing = (await this.get('/items')).find((i: any) => i.name === 'invoice_settings');
    const payload = { name: 'invoice_settings', data: settings };
    if (existing) {
      await this.put(`/items/${existing._id}`, payload);
    } else {
      await this.post('/items', payload);
    }
  }

  async getGSTRegistrations(): Promise<GSTRegistrationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'gst_reg').map(this.transformItem);
  }

  async saveGSTRegistration(reg: Partial<GSTRegistrationRecord>): Promise<GSTRegistrationRecord> {
    const payload = { name: 'gst_reg', data: reg };
    const res = reg.id ? await this.put(`/items/${reg.id}`, payload) : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async deleteGSTRegistration(id: string): Promise<void> {
    await this.delete(`/items/${id}`);
  }

  async getFoodLicenses(): Promise<FoodLicenseRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'food_lic').map(this.transformItem);
  }

  async saveFoodLicense(lic: Partial<FoodLicenseRecord>): Promise<FoodLicenseRecord> {
    const payload = { name: 'food_lic', data: lic };
    const res = lic.id ? await this.put(`/items/${lic.id}`, payload) : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async deleteFoodLicense(id: string): Promise<void> {
    await this.delete(`/items/${id}`);
  }

  async getMSMERegistrations(): Promise<MSMERegistrationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'msme').map(this.transformItem);
  }

  async saveMSMERegistration(reg: Partial<MSMERegistrationRecord>): Promise<MSMERegistrationRecord> {
    const payload = { name: 'msme', data: reg };
    const res = reg.id ? await this.put(`/items/${reg.id}`, payload) : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async deleteMSMERegistration(id: string): Promise<void> {
    await this.delete(`/items/${id}`);
  }

  async getMiscWork(): Promise<MiscWorkRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'misc_work').map(this.transformItem);
  }

  async saveMiscWork(work: Partial<MiscWorkRecord>): Promise<MiscWorkRecord> {
    const payload = { name: 'misc_work', data: work };
    const res = work.id ? await this.put(`/items/${work.id}`, payload) : await this.post('/items', payload);
    return this.transformItem(res);
  }

  async deleteMiscWork(id: string): Promise<void> {
    await this.delete(`/items/${id}`);
  }
}

export const api = new ApiService();

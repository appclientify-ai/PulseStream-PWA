import { API_BASE_URL } from '../constants.ts';
import { 
  Client, LitigationRecord, InvoiceRecord, PaymentRecord, 
  InvoiceSettings, GSTRegistrationRecord, FoodLicenseRecord, 
  MSMERegistrationRecord, MiscWorkRecord, User
} from '../types.ts';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private getFullUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const apiPath = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
    return `${API_BASE_URL}${apiPath}`;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      document.cookie = 'clientify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.reload();
      return;
    }
    
    const responseText = await response.text();
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      throw new Error(`Cloud Error ${response.status}: Failed to parse response from ${response.url}`);
    }
    
    if (!response.ok) {
      throw new Error(result.message || result.error || `Vault Access Failed (${response.status}) at ${response.url}`);
    }
    return result;
  }

  
  async patch(endpoint: string, data: any) {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const url = this.getFullUrl(endpoint);
    try {
      const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(data) });
      return this.handleResponse(res);
    } catch (err: any) {
      throw new Error(`Connection Failed: Could not reach ${url}.`);
    }
  }

  async get(endpoint: string) {
    const headers: HeadersInit = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const url = this.getFullUrl(endpoint);
    try {
      const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      return this.handleResponse(res);
    } catch (err: any) {
      throw new Error(`Connection Failed: Could not reach ${url}. Check VITE_BACKEND_URL.`);
    }
  }

  async post(endpoint: string, data: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
    const url = this.getFullUrl(endpoint);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return this.handleResponse(res);
    } catch (err: any) {
      throw new Error(`Connection Failed: Could not reach ${url}.`);
    }
  }

  async put(endpoint: string, data: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
    };
    const url = this.getFullUrl(endpoint);
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async delete(endpoint: string) {
    const headers: HeadersInit = this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    const url = this.getFullUrl(endpoint);
    const res = await fetch(url, { method: 'DELETE', headers });
    return this.handleResponse(res);
  }

  private transformItem<T>(item: any): T {
    if (!item) return null as any;
    return {
      ...item.data,
      id: item._id,
      createdAt: item.createdAt
    } as T;
  }

  async updateProfile(data: Partial<User>): Promise<{ user: User }> {
    return this.put('/auth/update', data);
  }

  async backupAllData(): Promise<string> {
    const items = await this.get('/items');
    return JSON.stringify(items, null, 2);
  }

  async restoreData(items: any[]): Promise<void> {
    for (const item of items) {
      const payload = { name: item.name, data: item.data };
      await this.post('/items', payload);
    }
  }

  async getDashboardSummary() {
    const results = await Promise.allSettled([
      this.getClients(),
      this.getLitigationRecords(),
      this.getInvoices(),
      this.getMiscWork(),
      this.getGSTRegistrations(),
      this.getFoodLicenses(),
      this.getMSMERegistrations(),
      this.getPayments()
    ]);
    return {
      clients: results[0].status === 'fulfilled' ? results[0].value : [],
      litigation: results[1].status === 'fulfilled' ? results[1].value : [],
      invoices: results[2].status === 'fulfilled' ? results[2].value : [],
      work: results[3].status === 'fulfilled' ? results[3].value : [],
      gstReg: results[4].status === 'fulfilled' ? results[4].value : [],
      foodLic: results[5].status === 'fulfilled' ? results[5].value : [],
      msme: results[6].status === 'fulfilled' ? results[6].value : [],
      payments: results[7].status === 'fulfilled' ? results[7].value : []
    };
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'client').map((i: any) => this.transformItem<Client>(i));
  }

  async saveClient(client: Partial<Client>): Promise<Client> {
    const payload = { name: 'client', data: client };
    const res = client.id 
      ? await this.put(`/items/${client.id}`, payload)
      : await this.post('/items', payload);
    return this.transformItem<Client>(res);
  }

  async deleteClient(id: string): Promise<void> {
    try {
      const clients = await this.getClients();
      const client = clients.find(c => c.id === id);
      if (client) {
        const [invoices, payments, litigation, works, gstRegs, foodLics, msmes] = await Promise.all([
          this.getInvoices(),
          this.getPayments(),
          this.getLitigationRecords(),
          this.getMiscWork(),
          this.getGSTRegistrations(),
          this.getFoodLicenses(),
          this.getMSMERegistrations()
        ]);
        
        const clientNames = [client.legalName?.trim().toLowerCase(), client.tradeName?.trim().toLowerCase()].filter(Boolean);
        const matchesClientName = (name?: string) => {
          if (!name) return false;
          const cleanName = name.trim().toLowerCase();
          return clientNames.includes(cleanName);
        };

        const invoicesToDelete = invoices.filter(i => i.clientId === id || matchesClientName(i.clientName) || matchesClientName(i.clientTradeName));
        const paymentsToDelete = payments.filter(p => p.clientId === id || matchesClientName(p.clientName) || matchesClientName(p.clientTradeName));
        const litigationToDelete = litigation.filter(l => l.clientId === id);

        const worksToDelete = works.filter(w => matchesClientName(w.clientName));
        const gstRegsToDelete = gstRegs.filter(g => matchesClientName(g.clientName));
        const foodLicsToDelete = foodLics.filter(f => matchesClientName(f.clientName));
        const msmesToDelete = msmes.filter(m => matchesClientName(m.clientName));

        await Promise.all([
          ...invoicesToDelete.map(i => this.deleteInvoice(i.id)),
          ...paymentsToDelete.map(p => this.deletePayment(p.id)),
          ...litigationToDelete.map(l => this.deleteLitigationRecord(l.id)),
          ...worksToDelete.map(w => this.deleteMiscWork(w.id)),
          ...gstRegsToDelete.map(g => this.deleteGSTRegistration(g.id)),
          ...foodLicsToDelete.map(f => this.deleteFoodLicense(f.id)),
          ...msmesToDelete.map(m => this.deleteMSMERegistration(m.id))
        ]);
      }
    } catch (err) {
      console.error('Error during cascade delete client:', err);
    }
    await this.delete(`/items/${id}`);
  }

  // --- Litigation ---
  async getLitigationRecords(): Promise<LitigationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'litigation').map((i: any) => this.transformItem<LitigationRecord>(i));
  }

  async deleteLitigationRecord(id: string): Promise<void> { await this.delete(`/items/${id}`); }
  async saveLitigationRecord(record: Partial<LitigationRecord>): Promise<LitigationRecord> {
    const payload = { name: 'litigation', data: record };
    const res = record.id 
      ? await this.put(`/items/${record.id}`, payload)
      : await this.post('/items', payload);
    return this.transformItem<LitigationRecord>(res);
  }

  // --- Invoices & Billing ---
  async getInvoices(): Promise<InvoiceRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'invoice').map((i: any) => this.transformItem<InvoiceRecord>(i));
  }

  async generateNextInvoiceNo(): Promise<string> {
    const invs = await this.getInvoices();
    const sets = await this.getInvoiceSettings();
    const fy = getFinancialYear();
    const prefix = sets.invoicePrefix || 'INV';
    
    // Filter invoices by the same financial year to find the next number
    const sameFyInvs = invs.filter(inv => inv.invoiceNo.includes(`${prefix}/${fy}/`));
    
    const existingNums = new Set<number>();
    for (const inv of sameFyInvs) {
       const parts = inv.invoiceNo.split('/');
       if (parts.length >= 3) {
          const numStr = parts[parts.length - 1];
          const num = parseInt(numStr, 10);
          if (!isNaN(num)) {
             existingNums.add(num);
          }
       }
    }
    
    let count = 1;
    while (existingNums.has(count)) {
       count++;
    }
    return `${prefix}/${fy}/${count.toString().padStart(2, '0')}`;
  }

  async migrateToPayment(invoiceId: string, paymentData: { date: string; mode: string; chequeNo?: string; amount?: number }): Promise<void> {
    const invs = await this.getInvoices();
    const inv = invs.find(i => i.id === invoiceId);
    if (!inv) return;

    const paidAmount = paymentData.amount || inv.totalAmount;
    const currentPaid = inv.amountPaid || 0;
    const newPaid = currentPaid + paidAmount;
    
    inv.amountPaid = newPaid;
    inv.balanceDue = inv.totalAmount - newPaid;
    
    if (inv.balanceDue <= 0) {
      inv.status = 'Paid';
      inv.balanceDue = 0;
    } else {
      inv.status = 'Partial';
    }

    inv.paymentDate = paymentData.date;
    inv.paymentMode = paymentData.mode;
    await this.saveInvoice(inv);
    
    await this.savePayment({
      clientId: inv.clientId,
      clientName: inv.clientName,
      clientTradeName: inv.clientTradeName,
      invoiceNo: inv.invoiceNo,
      date: paymentData.date,
      amount: paidAmount,
      mode: paymentData.mode as any,
      chequeNo: paymentData.chequeNo
    });
  }

  async saveInvoice(invoice: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
    const payload = { name: 'invoice', data: invoice };
    const res = invoice.id ? await this.put(`/items/${invoice.id}`, payload) : await this.post('/items', payload);
    return this.transformItem<InvoiceRecord>(res);
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      const invoice = invoices.find(i => i.id === id);
      if (invoice) {
        const payments = await this.getPayments();
        const paymentsToDelete = payments.filter(p => 
          (p.invoiceNo === invoice.invoiceNo && p.clientId === invoice.clientId) ||
          (p.invoiceNo === invoice.invoiceNo && p.clientName && invoice.clientName && p.clientName.trim().toLowerCase() === invoice.clientName.trim().toLowerCase())
        );
        await Promise.all(paymentsToDelete.map(p => this.deletePayment(p.id)));
      }
    } catch (err) {
      console.error('Error during cascade delete invoice payments:', err);
    }
    await this.delete(`/items/${id}`);
  }

  async getPayments(): Promise<PaymentRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'payment').map((i: any) => this.transformItem<PaymentRecord>(i));
  }

  async deletePayment(id: string) { await this.delete(`/items/${id}`); }
  async savePayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const payload = { name: 'payment', data: payment };
    const res = payment.id ? await this.put(`/items/${payment.id}`, payload) : await this.post('/items', payload);
    return this.transformItem<PaymentRecord>(res);
  }

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    const items = await this.get('/items');
    const set = items.find((i: any) => i.name === 'invoice_settings');
    if (set) return this.transformItem<InvoiceSettings>(set);
    return {
      firmName: 'Your Firm',
      firmAddress: '', firmMobile: '', firmEmail: '', firmGstin: '',
      invoicePrefix: 'INV/', bankName: '', accountNo: '', ifsc: '',
      upiId: '', terms: '', isGstEnabled: true
    };
  }

  async saveInvoiceSettings(settings: InvoiceSettings): Promise<void> {
    const all = await this.get('/items');
    const existing = all.find((i: any) => i.name === 'invoice_settings');
    const payload = { name: 'invoice_settings', data: settings };
    if (existing) await this.put(`/items/${existing._id}`, payload);
    else await this.post('/items', payload);
  }

  // --- Miscellaneous ---
  async getGSTRegistrations(): Promise<GSTRegistrationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'gst_reg').map((i: any) => this.transformItem<GSTRegistrationRecord>(i));
  }
  async saveGSTRegistration(reg: Partial<GSTRegistrationRecord>) {
    const payload = { name: 'gst_reg', data: reg };
    return this.transformItem<GSTRegistrationRecord>(reg.id ? await this.put(`/items/${reg.id}`, payload) : await this.post('/items', payload));
  }
  async deleteGSTRegistration(id: string) { await this.delete(`/items/${id}`); }

  async getFoodLicenses(): Promise<FoodLicenseRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'food_lic').map((i: any) => this.transformItem<FoodLicenseRecord>(i));
  }
  async saveFoodLicense(lic: Partial<FoodLicenseRecord>) {
    const payload = { name: 'food_lic', data: lic };
    return this.transformItem<FoodLicenseRecord>(lic.id ? await this.put(`/items/${lic.id}`, payload) : await this.post('/items', payload));
  }
  async deleteFoodLicense(id: string) { await this.delete(`/items/${id}`); }

  async getMSMERegistrations(): Promise<MSMERegistrationRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'msme').map((i: any) => this.transformItem<MSMERegistrationRecord>(i));
  }
  async saveMSMERegistration(reg: Partial<MSMERegistrationRecord>) {
    const payload = { name: 'msme', data: reg };
    return this.transformItem<MSMERegistrationRecord>(reg.id ? await this.put(`/items/${reg.id}`, payload) : await this.post('/items', payload));
  }
  async deleteMSMERegistration(id: string) { await this.delete(`/items/${id}`); }

  async getMiscWork(): Promise<MiscWorkRecord[]> {
    const items = await this.get('/items');
    return items.filter((i: any) => i.name === 'misc_work').map((i: any) => this.transformItem<MiscWorkRecord>(i));
  }
  async saveMiscWork(work: Partial<MiscWorkRecord>) {
    const payload = { name: 'misc_work', data: work };
    return this.transformItem<MiscWorkRecord>(work.id ? await this.put(`/items/${work.id}`, payload) : await this.post('/items', payload));
  }
  async deleteMiscWork(id: string) { await this.delete(`/items/${id}`); }



  
  async patchAppData(key: string, updates: Record<string, any>): Promise<any> {
    return this.patch(`/items/app_data/${key}/patch`, { updates });
  }
  
  async getAppData(key: string): Promise<any> {
    const items = await this.get('/items');
    const existing = items.find((i: any) => i.name === 'app_data_' + key);
    return existing ? existing.data : null;
  }
  async saveAppData(key: string, data: any): Promise<void> {
    const items = await this.get('/items');
    const existing = items.find((i: any) => i.name === 'app_data_' + key);
    const payload = { name: 'app_data_' + key, data: data };
    if (existing) {
      await this.put(`/items/${existing._id}`, payload);
    } else {
      await this.post('/items', payload);
    }
  }

}

export const api = new ApiService();
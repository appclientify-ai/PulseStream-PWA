import { API_BASE_URL } from '../constants.ts';
import { 
  Client, LitigationRecord, InvoiceRecord, PaymentRecord, 
  InvoiceSettings, GSTRegistrationRecord, FoodLicenseRecord, 
  MSMERegistrationRecord, MiscWorkRecord, User
} from '../types.ts';

function getFinancialYear(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

class ApiService {
  private token: string | null = null;
  private itemsCacheData: any[] | null = null;
  private itemsInflightPromise: Promise<any[]> | null = null;
  private categoryCacheMap: Map<string, { data: any[]; timestamp: number }> = new Map();
  private categoryInflightPromises: Map<string, Promise<any[]>> = new Map();

  setToken(token: string | null) {
    this.token = token;
  }

  public invalidateCache(category?: string) {
    if (category) {
      this.categoryCacheMap.delete(category);
      this.categoryInflightPromises.delete(category);
    } else {
      this.categoryCacheMap.clear();
      this.categoryInflightPromises.clear();
      this.itemsCacheData = null;
      this.itemsInflightPromise = null;
    }
  }

  async getItemsByCategory(category: string, forceRefresh = false): Promise<any[]> {
    if (!forceRefresh) {
      const cached = this.categoryCacheMap.get(category);
      if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 5)) {
        return cached.data;
      }
      const inflight = this.categoryInflightPromises.get(category);
      if (inflight) {
        return inflight;
      }
    }

    const promise = (async () => {
      try {
        const items = await this.get(`/items?name=${encodeURIComponent(category)}`);
        const result = Array.isArray(items) ? items : (items && Array.isArray(items.items) ? items.items : []);
        this.categoryCacheMap.set(category, { data: result, timestamp: Date.now() });
        return result;
      } finally {
        this.categoryInflightPromises.delete(category);
      }
    })();

    this.categoryInflightPromises.set(category, promise);
    return promise;
  }

  async getItems(forceRefresh = false): Promise<any[]> {
    if (!forceRefresh && this.itemsCacheData) {
      return this.itemsCacheData;
    }
    if (!forceRefresh && this.itemsInflightPromise) {
      return this.itemsInflightPromise;
    }

    this.itemsInflightPromise = (async () => {
      try {
        const items = await this.get('/items');
        this.itemsCacheData = Array.isArray(items) ? items : (items && Array.isArray(items.items) ? items.items : []);
        return this.itemsCacheData;
      } finally {
        this.itemsInflightPromise = null;
      }
    })();

    return this.itemsInflightPromise;
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
    this.invalidateCache();
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
    this.invalidateCache();
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
    this.invalidateCache();
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
    this.invalidateCache();
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
    const items = await this.getItems();
    return JSON.stringify(items, null, 2);
  }

  async restoreData(items: any[]): Promise<void> {
    for (const item of items) {
      const payload = { name: item.name, data: item.data };
      await this.post('/items', payload);
    }
  }

  async getDashboardData(): Promise<{ summary: any; filingDataCache: Record<string, any> }> {
    try {
      const res = await this.get('/items/dashboard/summary');
      if (res && res.summary) {
        return res;
      }
    } catch (e) {
      console.warn('Dedicated dashboard endpoint failed, falling back:', e);
    }
    const summary = await this.getDashboardSummary();
    return { summary, filingDataCache: {} };
  }

  async getMonthlyFilingData(): Promise<{ clients: Client[]; filingData: any; dueDates: any }> {
    try {
      const res = await this.get('/items/filing/monthly');
      if (res && res.clients) return res;
    } catch (e) {
      console.warn('Dedicated monthly filing endpoint failed, falling back:', e);
    }
    const clients = await this.getClients();
    const monthlyClients = clients.filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Monthly');
    const filingData = (await this.getAppData('clientify_monthly_filing_v3')) || {};
    const dueDates = (await this.getAppData('clientify_monthly_due_dates_v1')) || {};
    return { clients: monthlyClients, filingData, dueDates };
  }

  async getQuarterlyFilingData(): Promise<{ clients: Client[]; filingData: any; dueDates: any }> {
    try {
      const res = await this.get('/items/filing/quarterly');
      if (res && res.clients) return res;
    } catch (e) {
      console.warn('Dedicated quarterly filing endpoint failed, falling back:', e);
    }
    const clients = await this.getClients();
    const quarterlyClients = clients.filter(c => c && c.gstProfile?.regType === 'Regular' && c.gstProfile?.filingFreq === 'Quarterly');
    const filingData = (await this.getAppData('clientify_quarterly_filing_v3')) || {};
    const dueDates = (await this.getAppData('clientify_quarterly_due_dates_v1')) || {};
    return { clients: quarterlyClients, filingData, dueDates };
  }

  async getCompositionFilingData(): Promise<{ clients: Client[]; filingData: any; dueDates: any }> {
    try {
      const res = await this.get('/items/filing/composition');
      if (res && res.clients) return res;
    } catch (e) {
      console.warn('Dedicated composition filing endpoint failed, falling back:', e);
    }
    const clients = await this.getClients();
    const compClients = clients.filter(c => c && (c.gstProfile?.regType === 'Composition' || c.gstProfile?.taxpayerType === 'Composition' || c.gstProfile?.registrationType === 'Composition'));
    const filingData = (await this.getAppData('clientify_composition_filing_v3')) || {};
    const dueDates = (await this.getAppData('clientify_composition_due_dates_v1')) || {};
    return { clients: compClients, filingData, dueDates };
  }

  async getGSTR4FilingData(): Promise<{ clients: Client[]; filingData: any; dueDates: any; cmp08Data: any }> {
    try {
      const res = await this.get('/items/filing/gstr4');
      if (res && res.clients) return res;
    } catch (e) {
      console.warn('Dedicated GSTR-4 filing endpoint failed, falling back:', e);
    }
    const clients = await this.getClients();
    const compClients = clients.filter(c => c && (c.gstProfile?.regType === 'Composition' || c.gstProfile?.taxpayerType === 'Composition' || c.gstProfile?.registrationType === 'Composition'));
    const filingData = (await this.getAppData('clientify_gstr4_filing_v1')) || {};
    const dueDates = (await this.getAppData('clientify_gstr4_due_dates_v1')) || {};
    const cmp08Data = (await this.getAppData('clientify_composition_filing_v3')) || {};
    return { clients: compClients, filingData, dueDates, cmp08Data };
  }

  async getGSTR9FilingData(): Promise<{ clients: Client[]; watchlist: any; config: any; filingData: any; dueDates: any }> {
    try {
      const res = await this.get('/items/filing/gstr9');
      if (res && res.clients) return res;
    } catch (e) {
      console.warn('Dedicated GSTR-9 filing endpoint failed, falling back:', e);
    }
    const clients = await this.getClients();
    const watchlist = (await this.getAppData('clientify_gstr9_watchlist_v2')) || {};
    const config = (await this.getAppData('clientify_gstr9_config_v2')) || {};
    const filingData = (await this.getAppData('clientify_gstr9_filing_data_v2')) || {};
    const dueDates = (await this.getAppData('clientify_gstr9_due_dates_v2')) || {};
    return { clients, watchlist, config, filingData, dueDates };
  }

  async getITRReturnFilingData(): Promise<{ clients: Client[]; filingData: any; dueDates: any }> {
    try {
      const res = await this.get('/items/filing/itr');
      if (res && res.clients) return res;
    } catch (e) {
      console.warn('Dedicated ITR return filing endpoint failed, falling back:', e);
    }
    const clients = await this.getClients();
    const itrClients = clients.filter(c => c && c.itProfile && (c.status === 'Active' || c.status === 'Active Filing'));
    const filingData = (await this.getAppData('clientify_itr_filing_data_v2')) || {};
    const dueDates = (await this.getAppData('clientify_itr_due_dates_v1')) || {};
    return { clients: itrClients, filingData, dueDates };
  }

  async getTaxAuditFilingData(): Promise<{ clients: Client[]; watchlist: any; filingData: any; dueDates: any }> {
    try {
      const res = await this.get('/items/filing/audit');
      if (res && res.clients) return res;
    } catch (e) {
      console.warn('Dedicated Tax Audit filing endpoint failed, falling back:', e);
    }
    const clients = await this.getClients();
    const watchlist = (await this.getAppData('clientify_audit_watchlist_v3')) || {};
    const filingData = (await this.getAppData('clientify_audit_fin_data_v3')) || {};
    const dueDates = (await this.getAppData('clientify_audit_due_dates_v1')) || {};
    return { clients, watchlist, filingData, dueDates };
  }

  async getLitigationFilingData(): Promise<{ clients: Client[]; litigation: LitigationRecord[] }> {
    try {
      const res = await this.get('/items/filing/litigation');
      if (res && res.clients && res.litigation) return res;
    } catch (e) {
      console.warn('Dedicated litigation endpoint failed, falling back:', e);
    }
    const [clients, litigation] = await Promise.all([
      this.getClients(),
      this.getLitigationRecords()
    ]);
    return { clients, litigation };
  }

  async getMessengerClientsAll(): Promise<Client[]> {
    try {
      return await this.get('/items/messenger/all');
    } catch (e) {
      console.warn('Dedicated messenger all endpoint failed, falling back:', e);
      return this.getClients();
    }
  }

  async getMessengerClientsGst(): Promise<Client[]> {
    try {
      return await this.get('/items/messenger/gst');
    } catch (e) {
      console.warn('Dedicated messenger gst endpoint failed, falling back:', e);
      const clients = await this.getClients();
      return clients.filter(c => Boolean(c.gstProfile?.gstin || c.services?.includes('GST') || c.gstProfile?.regType));
    }
  }

  async getMessengerClientsItr(): Promise<Client[]> {
    try {
      return await this.get('/items/messenger/itr');
    } catch (e) {
      console.warn('Dedicated messenger itr endpoint failed, falling back:', e);
      const clients = await this.getClients();
      return clients.filter(c => Boolean(c.itProfile?.pan || c.services?.includes('IT') || c.services?.includes('ITR') || c.itProfile?.fileType));
    }
  }

  async getMessengerClientsAudit(): Promise<Client[]> {
    try {
      return await this.get('/items/messenger/audit');
    } catch (e) {
      console.warn('Dedicated messenger audit endpoint failed, falling back:', e);
      const clients = await this.getClients();
      return clients.filter(c => Boolean(c.itProfile?.auditApplicable || c.itProfile?.advisoryWork?.taxAudit || c.services?.includes('Audit') || (c.itProfile?.fileType && c.itProfile.fileType.toLowerCase().includes('audit'))));
    }
  }

  async getMessengerClientsGstr4(): Promise<Client[]> {
    try {
      return await this.get('/items/messenger/gstr4');
    } catch (e) {
      console.warn('Dedicated messenger gstr4 endpoint failed, falling back:', e);
      const clients = await this.getClients();
      return clients.filter(c => c.gstProfile?.regType === 'Composition');
    }
  }

  async getMessengerClientsGstr9(): Promise<Client[]> {
    try {
      return await this.get('/items/messenger/gstr9');
    } catch (e) {
      console.warn('Dedicated messenger gstr9 endpoint failed, falling back:', e);
      const [clients, watchlist] = await Promise.all([
        this.getClients(),
        this.getAppData('clientify_gstr9_watchlist_v2') || {}
      ]);
      const watchlistIds = new Set();
      Object.values(watchlist).forEach((arr: any) => {
        if (Array.isArray(arr)) arr.forEach(id => watchlistIds.add(id));
      });
      return clients.filter(c => watchlistIds.has(c.id) || Boolean(c.gstProfile?.gstin));
    }
  }

  async getDashboardSummary() {
    const [clients, litigation, invoices, work, gstReg, foodLic, msme, payments] = await Promise.all([
      this.getClients(),
      this.getLitigationRecords(),
      this.getInvoices(),
      this.getMiscWork(),
      this.getGSTRegistrations(),
      this.getFoodLicenses(),
      this.getMSMERegistrations(),
      this.getPayments()
    ]);
    return { clients, litigation, invoices, work, gstReg, foodLic, msme, payments };
  }

  // --- Clients ---
  async getClients(forceRefresh = false): Promise<Client[]> {
    const items = await this.getItemsByCategory('client', forceRefresh);
    return items.map((i: any) => this.transformItem<Client>(i));
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
        const [invoices, payments, litigation, works, gstRegs, foodLics, msmes, tribunal, highcourt] = await Promise.all([
          this.getInvoices(),
          this.getPayments(),
          this.getLitigationRecords(),
          this.getMiscWork(),
          this.getGSTRegistrations(),
          this.getFoodLicenses(),
          this.getMSMERegistrations(),
          this.getTribunalRecords(),
          this.getHighCourtRecords()
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
        const tribunalToDelete = tribunal.filter(t => t.clientId === id || matchesClientName(t.clientName));
        const highcourtToDelete = highcourt.filter(h => h.clientId === id || matchesClientName(h.clientName));

        await Promise.all([
          ...invoicesToDelete.map(i => this.deleteInvoice(i.id)),
          ...paymentsToDelete.map(p => this.deletePayment(p.id)),
          ...litigationToDelete.map(l => this.deleteLitigationRecord(l.id)),
          ...worksToDelete.map(w => this.deleteMiscWork(w.id)),
          ...gstRegsToDelete.map(g => this.deleteGSTRegistration(g.id)),
          ...foodLicsToDelete.map(f => this.deleteFoodLicense(f.id)),
          ...msmesToDelete.map(m => this.deleteMSMERegistration(m.id)),
          ...tribunalToDelete.map(t => this.deleteTribunalRecord(t.id)),
          ...highcourtToDelete.map(h => this.deleteHighCourtRecord(h.id))
        ]);
      }
    } catch (err) {
      console.error('Error during cascade delete client:', err);
    }
    await this.delete(`/items/${id}`);
  }

  // --- Litigation ---
  async getLitigationRecords(forceRefresh = false): Promise<LitigationRecord[]> {
    const items = await this.getItemsByCategory('litigation', forceRefresh);
    return items.map((i: any) => this.transformItem<LitigationRecord>(i));
  }

  async deleteLitigationRecord(id: string): Promise<void> { await this.delete(`/items/${id}`); }
  async saveLitigationRecord(record: Partial<LitigationRecord>): Promise<LitigationRecord> {
    const payload = { name: 'litigation', data: record };
    const res = record.id 
      ? await this.put(`/items/${record.id}`, payload)
      : await this.post('/items', payload);
    return this.transformItem<LitigationRecord>(res);
  }

  // --- Tribunal Records (Separate Dataset) ---
  async getTribunalRecords(forceRefresh = false): Promise<LitigationRecord[]> {
    const docs = await this.get('/tribunal_records');
    return (docs || []).map((d: any) => ({
      ...d,
      id: d._id || d.id
    }));
  }
  async saveTribunalRecord(record: Partial<LitigationRecord>): Promise<LitigationRecord> {
    const payload = { ...record };
    delete payload.id;
    const res = record.id 
      ? await this.put(`/tribunal_records/${record.id}`, payload)
      : await this.post('/tribunal_records', payload);
    return { ...res, id: res._id || res.id };
  }
  async deleteTribunalRecord(id: string): Promise<void> {
    await this.delete(`/tribunal_records/${id}`);
  }

  // --- High Court Records (Separate Dataset) ---
  async getHighCourtRecords(forceRefresh = false): Promise<LitigationRecord[]> {
    const docs = await this.get('/highcourt_records');
    return (docs || []).map((d: any) => ({
      ...d,
      id: d._id || d.id
    }));
  }
  async saveHighCourtRecord(record: Partial<LitigationRecord>): Promise<LitigationRecord> {
    const payload = { ...record };
    delete payload.id;
    const res = record.id 
      ? await this.put(`/highcourt_records/${record.id}`, payload)
      : await this.post('/highcourt_records', payload);
    return { ...res, id: res._id || res.id };
  }
  async deleteHighCourtRecord(id: string): Promise<void> {
    await this.delete(`/highcourt_records/${id}`);
  }

  // --- Invoices & Billing ---
  async getPaginatedCategory<T>(category: string, page = 1, limit = 25, search = ''): Promise<{ items: T[]; total: number; page: number; limit: number; totalPages: number }> {
    const params = new URLSearchParams({ name: category, page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    const res = await this.get(`/items?${params.toString()}`);
    if (res && Array.isArray(res.items)) {
      return {
        ...res,
        items: res.items.map((i: any) => this.transformItem<T>(i))
      };
    }
    const itemsArray = Array.isArray(res) ? res : [];
    return {
      items: itemsArray.map((i: any) => this.transformItem<T>(i)),
      total: itemsArray.length,
      page,
      limit,
      totalPages: Math.ceil(itemsArray.length / limit) || 1
    };
  }

  async getInvoices(forceRefresh = false): Promise<InvoiceRecord[]> {
    const items = await this.getItemsByCategory('invoice', forceRefresh);
    return items.map((i: any) => this.transformItem<InvoiceRecord>(i));
  }

  async getInvoicesPaginated(page = 1, limit = 25, search = '') {
    return this.getPaginatedCategory<InvoiceRecord>('invoice', page, limit, search);
  }

  async getClientsPaginated(page = 1, limit = 25, search = '') {
    return this.getPaginatedCategory<Client>('client', page, limit, search);
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
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('clientify_db_change'));
    return this.transformItem<InvoiceRecord>(res);
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      const invoice = invoices.find(i => i.id === id);
      if (invoice) {
        const payments = await this.getPayments();
        const paymentsToDelete = payments.filter(p => 
          (p.invoiceNo && invoice.invoiceNo && p.invoiceNo.trim() === invoice.invoiceNo.trim()) ||
          (p.clientId && invoice.clientId && p.clientId === invoice.clientId && p.invoiceNo === invoice.invoiceNo)
        );
        for (const p of paymentsToDelete) {
          try {
            await this.delete(`/items/${p.id}`);
          } catch (e) {
            console.error('Cascade payment delete error:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error during cascade delete invoice payments:', err);
    }
    await this.delete(`/items/${id}`);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('clientify_db_change'));
  }

  async purgeOrphanAndCancelledRecords(): Promise<{ purgedCount: number }> {
    try {
      const rawItems = await this.getItems();
      const invoices = rawItems.filter((i: any) => i.name === 'invoice').map((i: any) => this.transformItem<InvoiceRecord>(i));
      const activeInvoiceNos = new Set(invoices.filter(i => i.status !== 'Cancelled').map(i => i.invoiceNo));

      let purgedCount = 0;

      for (const item of rawItems) {
        if (item.name === 'invoice' && item.data?.status === 'Cancelled') {
          await this.delete(`/items/${item._id}`);
          purgedCount++;
        } else if (item.name === 'payment' && item.data?.invoiceNo) {
          if (!activeInvoiceNos.has(item.data.invoiceNo)) {
            await this.delete(`/items/${item._id}`);
            purgedCount++;
          }
        }
      }

      if (purgedCount > 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('clientify_db_change'));
      }
      return { purgedCount };
    } catch (err) {
      console.error('Error during database purge:', err);
      return { purgedCount: 0 };
    }
  }

  async getPayments(forceRefresh = false): Promise<PaymentRecord[]> {
    const items = await this.getItemsByCategory('payment', forceRefresh);
    return items.map((i: any) => this.transformItem<PaymentRecord>(i));
  }

  async deletePayment(id: string) {
    await this.delete(`/items/${id}`);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('clientify_db_change'));
  }
  async savePayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const payload = { name: 'payment', data: payment };
    const res = payment.id ? await this.put(`/items/${payment.id}`, payload) : await this.post('/items', payload);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('clientify_db_change'));
    return this.transformItem<PaymentRecord>(res);
  }

  async getInvoiceSettings(forceRefresh = false): Promise<InvoiceSettings> {
    const items = await this.getItemsByCategory('invoice_settings', forceRefresh);
    const set = items[0];
    if (set) return this.transformItem<InvoiceSettings>(set);
    return {
      firmName: 'Your Firm',
      firmAddress: '', firmMobile: '', firmEmail: '', firmGstin: '',
      invoicePrefix: 'INV/', bankName: '', accountNo: '', ifsc: '',
      upiId: '', terms: '', isGstEnabled: true
    };
  }

  async saveInvoiceSettings(settings: InvoiceSettings): Promise<void> {
    const all = await this.getItemsByCategory('invoice_settings', true);
    const existing = all[0];
    const payload = { name: 'invoice_settings', data: settings };
    if (existing) await this.put(`/items/${existing.id || existing._id}`, payload);
    else await this.post('/items', payload);
  }

  // --- Miscellaneous ---
  async getGSTRegistrations(forceRefresh = false): Promise<GSTRegistrationRecord[]> {
    const docs = await this.get('/gst_registrations');
    return (docs || []).map((d: any) => ({
      ...d,
      id: d._id || d.id
    }));
  }
  async saveGSTRegistration(reg: Partial<GSTRegistrationRecord>) {
    const payload = { ...reg };
    delete payload.id;
    const res = reg.id 
      ? await this.put(`/gst_registrations/${reg.id}`, payload) 
      : await this.post('/gst_registrations', payload);
    return { ...res, id: res._id || res.id };
  }
  async deleteGSTRegistration(id: string) { await this.delete(`/gst_registrations/${id}`); }

  async getFoodLicenses(forceRefresh = false): Promise<FoodLicenseRecord[]> {
    const docs = await this.get('/food_licenses');
    return (docs || []).map((d: any) => ({
      ...d,
      id: d._id || d.id
    }));
  }
  async saveFoodLicense(lic: Partial<FoodLicenseRecord>) {
    const payload = { ...lic };
    delete payload.id;
    const res = lic.id 
      ? await this.put(`/food_licenses/${lic.id}`, payload) 
      : await this.post('/food_licenses', payload);
    return { ...res, id: res._id || res.id };
  }
  async deleteFoodLicense(id: string) { await this.delete(`/food_licenses/${id}`); }

  async getMSMERegistrations(forceRefresh = false): Promise<MSMERegistrationRecord[]> {
    const docs = await this.get('/msme_registrations');
    return (docs || []).map((d: any) => ({
      ...d,
      id: d._id || d.id
    }));
  }
  async saveMSMERegistration(reg: Partial<MSMERegistrationRecord>) {
    const payload = { ...reg };
    delete payload.id;
    const res = reg.id 
      ? await this.put(`/msme_registrations/${reg.id}`, payload) 
      : await this.post('/msme_registrations', payload);
    return { ...res, id: res._id || res.id };
  }
  async deleteMSMERegistration(id: string) { await this.delete(`/msme_registrations/${id}`); }

  async getMiscWork(forceRefresh = false): Promise<MiscWorkRecord[]> {
    const docs = await this.get('/misc_work');
    return (docs || []).map((d: any) => ({
      ...d,
      id: d._id || d.id
    }));
  }
  async saveMiscWork(work: Partial<MiscWorkRecord>) {
    const payload = { ...work };
    delete payload.id;
    const res = work.id 
      ? await this.put(`/misc_work/${work.id}`, payload) 
      : await this.post('/misc_work', payload);
    return { ...res, id: res._id || res.id };
  }
  async deleteMiscWork(id: string) { await this.delete(`/misc_work/${id}`); }

  async patchAppData(key: string, updates: Record<string, any>): Promise<any> {
    return this.patch(`/items/app_data/${key}/patch`, { updates });
  }
  
  async getAppData(key: string, forceRefresh = false): Promise<any> {
    const items = await this.getItemsByCategory('app_data_' + key, forceRefresh);
    const existing = items[0];
    return existing ? existing.data : null;
  }
  async saveAppData(key: string, data: any): Promise<void> {
    const items = await this.getItemsByCategory('app_data_' + key, true);
    const existing = items[0];
    const payload = { name: 'app_data_' + key, data: data };
    if (existing) {
      await this.put(`/items/${existing.id || existing._id}`, payload);
    } else {
      await this.post('/items', payload);
    }
  }

}

export const api = new ApiService();
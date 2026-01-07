
import { User, Message, Client, LitigationRecord, InvoiceRecord, PaymentRecord, ReminderRecord, GSTRegistrationRecord, FoodLicenseRecord, MSMERegistrationRecord, MiscWorkRecord, InvoiceSettings } from '../types';

class MockBackend {
  private STORAGE_KEY_USERS = 'clientify_mock_users';
  private STORAGE_KEY_CLIENTS = 'clientify_mock_clients';
  private STORAGE_KEY_ITEMS = 'clientify_mock_items';
  private STORAGE_KEY_LITIGATION = 'clientify_mock_litigation';
  private STORAGE_KEY_INVOICES = 'clientify_mock_invoices';
  private STORAGE_KEY_PAYMENTS = 'clientify_mock_payments';
  private STORAGE_KEY_REMINDERS = 'clientify_mock_reminders';
  private STORAGE_KEY_MISC_GST = 'clientify_mock_misc_gst';
  private STORAGE_KEY_MISC_FOOD = 'clientify_mock_misc_food';
  private STORAGE_KEY_MISC_MSME = 'clientify_mock_misc_msme';
  private STORAGE_KEY_MISC_WORK = 'clientify_mock_misc_work';
  private STORAGE_KEY_INV_SETTINGS = 'clientify_invoice_settings';

  constructor() {
    if (!localStorage.getItem(this.STORAGE_KEY_USERS)) {
      const defaultUsers = [
        { id: 'mock_1', username: 'Demo CA', user_id: 'admin', password: 'password', email_id: 'demo@vaultcore.com', status: 'online' },
        { id: 'mock_test_a', username: 'Quick Tester', user_id: 'a', password: 'a', email_id: 'tester@vaultcore.com', status: 'online' }
      ];
      localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async signup(data: any) {
    const users = this.getUsers();
    if (users.find((u: any) => u.user_id === data.user_id)) throw new Error('User ID already taken');
    const newUser = { ...data, id: this.generateId('u'), createdAt: Date.now(), status: 'online' };
    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
    return { token: 'mock_token_' + newUser.id, user: newUser };
  }

  async login(userId: string, pass: string) {
    const users = this.getUsers();
    const user = users.find((u: any) => u.user_id === userId && u.password === pass);
    if (!user) throw new Error('Invalid credentials');
    return { token: 'mock_token_' + user.id, user };
  }

  async me(token: string) {
    const userId = token.replace('mock_token_', '');
    const user = this.getUsers().find((u: any) => u.id === userId);
    if (!user) throw new Error('Session expired');
    return { user };
  }

  async getClients(): Promise<Client[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_CLIENTS) || '[]');
  }

  async saveClient(data: Partial<Client>): Promise<Client> {
    const clients = await this.getClients();
    if (data.id) {
      const index = clients.findIndex(c => c.id === data.id);
      if (index !== -1) {
        clients[index] = { ...clients[index], ...data } as Client;
        localStorage.setItem(this.STORAGE_KEY_CLIENTS, JSON.stringify(clients));
        return clients[index];
      }
    }
    const newClient = { ...data, id: this.generateId('c'), createdAt: Date.now() } as Client;
    clients.push(newClient);
    localStorage.setItem(this.STORAGE_KEY_CLIENTS, JSON.stringify(clients));
    return newClient;
  }

  async deleteClient(id: string): Promise<void> {
    const clients = await this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(this.STORAGE_KEY_CLIENTS, JSON.stringify(filtered));
  }

  // Litigation Methods
  async getLitigationRecords(): Promise<LitigationRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_LITIGATION) || '[]');
  }

  async saveLitigationRecord(data: Partial<LitigationRecord>): Promise<LitigationRecord> {
    const records = await this.getLitigationRecords();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as LitigationRecord;
        localStorage.setItem(this.STORAGE_KEY_LITIGATION, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('lit'), createdAt: Date.now() } as LitigationRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_LITIGATION, JSON.stringify(records));
    return newRec;
  }

  // Invoice Methods
  async getInvoiceSettings(): Promise<InvoiceSettings> {
    const saved = localStorage.getItem(this.STORAGE_KEY_INV_SETTINGS);
    if (saved) return JSON.parse(saved);
    return {
      firmName: 'Vault Core Tax Practice',
      firmAddress: '101 Professional Plaza, Central Business District, India',
      firmMobile: '9876543210',
      firmEmail: 'office@vaultcore.tax',
      firmGstin: '27ABCDE1234F1Z5',
      invoicePrefix: 'CA/',
      bankName: '',
      accountNo: '',
      ifsc: '',
      upiId: '',
      terms: '1. Payment due within 7 days.\n2. Late fees of 2% per month applies.',
      isGstEnabled: true
    };
  }

  async saveInvoiceSettings(data: InvoiceSettings): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY_INV_SETTINGS, JSON.stringify(data));
  }

  async getInvoices(): Promise<InvoiceRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_INVOICES) || '[]');
  }

  async generateNextInvoiceNo(): Promise<string> {
    const invoices = await this.getInvoices();
    const payments = await this.getPayments();
    const settings = await this.getInvoiceSettings();
    const now = new Date();
    const currentFY = now.getMonth() >= 3 
      ? `${now.getFullYear()}-${(now.getFullYear() + 1).toString().slice(-2)}`
      : `${now.getFullYear() - 1}-${now.getFullYear().toString().slice(-2)}`;
    
    const allHistoric = [...invoices, ...payments.filter(p => !!p.invoiceNo)];
    const fyInvoices = allHistoric.filter(i => (i.invoiceNo || '').includes(currentFY));
    const nextSerial = (fyInvoices.length + 1).toString().padStart(3, '0');
    return `${settings.invoicePrefix}${currentFY}/${nextSerial}`;
  }

  async saveInvoice(data: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
    const records = await this.getInvoices();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as InvoiceRecord;
        localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('inv'), createdAt: Date.now() } as InvoiceRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify(records));
    return newRec;
  }

  async migrateToPayment(invoiceId: string, paymentData: { date: string, mode: string, chequeNo?: string }): Promise<void> {
    const invoices = await this.getInvoices();
    const payments = await this.getPayments();
    const invIdx = invoices.findIndex(i => i.id === invoiceId);
    if (invIdx === -1) return;
    const inv = invoices[invIdx];
    
    const newPayment: PaymentRecord = {
      id: this.generateId('pay'),
      clientId: inv.clientId,
      clientName: inv.clientName,
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.date,
      amount: inv.totalAmount,
      date: paymentData.date,
      mode: paymentData.mode as any,
      chequeNo: paymentData.chequeNo,
      originalItems: inv.items,
      createdAt: Date.now()
    };
    
    payments.push(newPayment);
    invoices.splice(invIdx, 1);
    localStorage.setItem(this.STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  }

  async getPayments(): Promise<PaymentRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_PAYMENTS) || '[]');
  }

  async savePayment(data: Partial<PaymentRecord>): Promise<PaymentRecord> {
    const records = await this.getPayments();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as PaymentRecord;
        localStorage.setItem(this.STORAGE_KEY_PAYMENTS, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('pay'), createdAt: Date.now() } as PaymentRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_PAYMENTS, JSON.stringify(records));
    return newRec;
  }

  async getReminders(): Promise<ReminderRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_REMINDERS) || '[]');
  }

  async saveReminder(data: Partial<ReminderRecord>): Promise<ReminderRecord> {
    const records = await this.getReminders();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as ReminderRecord;
        localStorage.setItem(this.STORAGE_KEY_REMINDERS, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('rem'), createdAt: Date.now() } as ReminderRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_REMINDERS, JSON.stringify(records));
    return newRec;
  }

  async getGSTRegistrations(): Promise<GSTRegistrationRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_MISC_GST) || '[]');
  }

  async saveGSTRegistration(data: Partial<GSTRegistrationRecord>): Promise<GSTRegistrationRecord> {
    const records = await this.getGSTRegistrations();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as GSTRegistrationRecord;
        localStorage.setItem(this.STORAGE_KEY_MISC_GST, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('gstreg'), createdAt: Date.now() } as GSTRegistrationRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_MISC_GST, JSON.stringify(records));
    return newRec;
  }

  async deleteGSTRegistration(id: string): Promise<void> {
    const records = await this.getGSTRegistrations();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEY_MISC_GST, JSON.stringify(filtered));
  }

  async getFoodLicenses(): Promise<FoodLicenseRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_MISC_FOOD) || '[]');
  }

  async saveFoodLicense(data: Partial<FoodLicenseRecord>): Promise<FoodLicenseRecord> {
    const records = await this.getFoodLicenses();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as FoodLicenseRecord;
        localStorage.setItem(this.STORAGE_KEY_MISC_FOOD, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('foodlic'), createdAt: Date.now() } as FoodLicenseRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_MISC_FOOD, JSON.stringify(records));
    return newRec;
  }

  async deleteFoodLicense(id: string): Promise<void> {
    const records = await this.getFoodLicenses();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEY_MISC_FOOD, JSON.stringify(filtered));
  }

  async getMSMERegistrations(): Promise<MSMERegistrationRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_MISC_MSME) || '[]');
  }

  async saveMSMERegistration(data: Partial<MSMERegistrationRecord>): Promise<MSMERegistrationRecord> {
    const records = await this.getMSMERegistrations();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as MSMERegistrationRecord;
        localStorage.setItem(this.STORAGE_KEY_MISC_MSME, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('msme'), createdAt: Date.now() } as MSMERegistrationRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_MISC_MSME, JSON.stringify(records));
    return newRec;
  }

  async deleteMSMERegistration(id: string): Promise<void> {
    const records = await this.getMSMERegistrations();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEY_MISC_MSME, JSON.stringify(filtered));
  }

  async getMiscWork(): Promise<MiscWorkRecord[]> {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_MISC_WORK) || '[]');
  }

  async saveMiscWork(data: Partial<MiscWorkRecord>): Promise<MiscWorkRecord> {
    const records = await this.getMiscWork();
    if (data.id) {
      const idx = records.findIndex(r => r.id === data.id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...data } as MiscWorkRecord;
        localStorage.setItem(this.STORAGE_KEY_MISC_WORK, JSON.stringify(records));
        return records[idx];
      }
    }
    const newRec = { ...data, id: this.generateId('mwork'), createdAt: Date.now() } as MiscWorkRecord;
    records.push(newRec);
    localStorage.setItem(this.STORAGE_KEY_MISC_WORK, JSON.stringify(records));
    return newRec;
  }

  async deleteMiscWork(id: string): Promise<void> {
    const records = await this.getMiscWork();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(this.STORAGE_KEY_MISC_WORK, JSON.stringify(filtered));
  }

  async getItems(userId: string): Promise<any[]> {
    const items = JSON.parse(localStorage.getItem(this.STORAGE_KEY_ITEMS) || '[]');
    return items.filter((i: any) => i.createdBy === userId);
  }

  async createItem(userId: string, data: any): Promise<any> {
    const allItems = JSON.parse(localStorage.getItem(this.STORAGE_KEY_ITEMS) || '[]');
    const users = this.getUsers();
    const user = users.find((u: any) => u.id === userId);

    const newItem = {
      ...data,
      id: this.generateId('item'),
      createdBy: userId,
      creatorName: user?.username || 'Unknown',
      createdAt: new Date().toISOString()
    };
    allItems.push(newItem);
    localStorage.setItem(this.STORAGE_KEY_ITEMS, JSON.stringify(allItems));
    return newItem;
  }

  private getUsers() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY_USERS) || '[]');
  }
}

export const mockBackend = new MockBackend();


import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { socketService } from '../services/socket.ts';
import { 
  Client, 
  LitigationRecord, 
  MiscWorkRecord, 
  PaymentRecord, 
  GSTRegistrationRecord, 
  FoodLicenseRecord, 
  MSMERegistrationRecord, 
  InvoiceRecord 
} from '../types.ts';

export const useClientData = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [litigationRecords, setLitigationRecords] = useState<LitigationRecord[]>([]);
  const [miscellaneousWork, setMiscellaneousWork] = useState<MiscWorkRecord[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const summary = await api.getDashboardSummary();
      setClients(summary.clients || []);
      setInvoices(summary.invoices || []);
      setLitigationRecords(summary.litigation || []);
      setMiscellaneousWork(summary.work || []);

      const [pays] = await Promise.all([
        api.getPayments()
      ]);
      setPayments(pays || []);
    } catch (err) {
      console.error("Vault Sync Failure:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    socketService.connect();
    socketService.on('db_item_change', fetchData);
    return () => {
      socketService.disconnect();
    };
  }, [fetchData]);

  const updateClient = async (client: Partial<Client>) => {
    await api.saveClient(client);
    fetchData();
  };

  return {
    clients,
    invoices,
    litigationRecords,
    miscellaneousWork,
    payments,
    isLoading,
    isSyncing,
    fetchData,
    updateClient,
    gstNotices: litigationRecords.filter(r => r.category === 'Notice'),
    gstAppeals: litigationRecords.filter(r => r.category === 'Appeal'),
    gstTribunalAppeals: litigationRecords.filter(r => r.category === 'Tribunal'),
    highCourtAppeals: litigationRecords.filter(r => r.category === 'HighCourt'),
    gstRegistrations: [], 
    foodLicenses: [],
    msmeRegistrations: [],
    reminders: []
  };
};

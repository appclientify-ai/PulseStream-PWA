
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
  const [gstRegistrations, setGstRegistrations] = useState<GSTRegistrationRecord[]>([]);
  const [foodLicenses, setFoodLicenses] = useState<FoodLicenseRecord[]>([]);
  const [msmeRegistrations, setMsmeRegistrations] = useState<MSMERegistrationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const summary = await api.getDashboardSummary();
      setClients(summary.clients || []);
      setInvoices(summary.invoices || []);
      setLitigationRecords(summary.litigation || []);
      setMiscellaneousWork(summary.work || []);

      const [gstRegs, foodLics, msmeRegs, pays] = await Promise.all([
        api.getGSTRegistrations(),
        api.getFoodLicenses(),
        api.getMSMERegistrations(),
        api.getPayments()
      ]);
      
      setGstRegistrations(gstRegs || []);
      setFoodLicenses(foodLics || []);
      setMsmeRegistrations(msmeRegs || []);
      setPayments(pays || []);
    } catch (err) {
      console.error("Vault Data Sync Error:", err);
    } finally {
      setIsLoading(false);
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

  const updateClient = async (client: Client) => {
    await api.saveClient(client);
    fetchData();
  };

  // Derived exports for Dashboard/Litigation modules
  return {
    clients,
    invoices,
    litigationRecords,
    miscellaneousWork,
    gstRegistrations,
    foodLicenses,
    msmeRegistrations,
    payments,
    isLoading,
    fetchData,
    updateClient,
    gstNotices: litigationRecords.filter(r => r.category === 'Notice'),
    gstAppeals: litigationRecords.filter(r => r.category === 'Appeal'),
    gstTribunalAppeals: litigationRecords.filter(r => r.category === 'Tribunal'),
    highCourtAppeals: litigationRecords.filter(r => r.category === 'HighCourt'),
    reminders: [] // Reminders can be computed from deadlines
  };
};

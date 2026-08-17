import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { calculateRenewalDueDate } from '../dateUtils.ts';
import { getAllStatutoryDeadlines } from '../services/statutoryDeadlines';

export function useModuleData<T = any>(moduleKey: string, clientId?: string) {
  return useQuery<T>({
    queryKey: clientId ? [moduleKey, clientId] : [moduleKey],
    queryFn: async () => {
      if (moduleKey === 'clients') {
        return (await api.getClients()) as unknown as T;
      }
      if (moduleKey === 'dashboard_data') {
        return (await api.getDashboardData()) as unknown as T;
      }
      if (moduleKey === 'monthly_filing_page_data') {
        return (await api.getMonthlyFilingData()) as unknown as T;
      }
      if (moduleKey === 'quarterly_filing_page_data') {
        return (await api.getQuarterlyFilingData()) as unknown as T;
      }
      if (moduleKey === 'composition_filing_page_data') {
        return (await api.getCompositionFilingData()) as unknown as T;
      }
      if (moduleKey === 'gstr4_filing_page_data') {
        return (await api.getGSTR4FilingData()) as unknown as T;
      }
      if (moduleKey === 'gstr9_filing_page_data') {
        return (await api.getGSTR9FilingData()) as unknown as T;
      }
      if (moduleKey === 'itr_filing_page_data') {
        return (await api.getITRReturnFilingData()) as unknown as T;
      }
      if (moduleKey === 'tax_audit_filing_page_data') {
        return (await api.getTaxAuditFilingData()) as unknown as T;
      }
      if (moduleKey === 'misc_work') {
        return (await api.getMiscWork(true)) as unknown as T;
      }
      if (moduleKey === 'litigation_filing_page_data') {
        return (await api.getLitigationFilingData()) as unknown as T;
      }
      if (moduleKey === 'gst_notice_pending') {
        return (await api.getGstNoticePending()) as unknown as T;
      }
      if (moduleKey === 'gst_notice_filed') {
        return (await api.getGstNoticeFiled()) as unknown as T;
      }
      if (moduleKey === 'gst_notice_demand') {
        return (await api.getGstNoticeDemand()) as unknown as T;
      }
      if (moduleKey === 'gst_notice_drop') {
        return (await api.getGstNoticeDrop()) as unknown as T;
      }
      if (moduleKey === 'gst_appeal_pending') {
        return (await api.getGstAppealPending()) as unknown as T;
      }
      if (moduleKey === 'gst_appeal_filed') {
        return (await api.getGstAppealFiled()) as unknown as T;
      }
      if (moduleKey === 'gst_appeal_demand') {
        return (await api.getGstAppealDemand()) as unknown as T;
      }
      if (moduleKey === 'gst_appeal_drop') {
        return (await api.getGstAppealDrop()) as unknown as T;
      }
      if (moduleKey === 'gst_clients') {
        return (await api.getGstClients()) as unknown as T;
      }
      if (moduleKey === 'it_clients') {
        return (await api.getItClients()) as unknown as T;
      }
      if (moduleKey === 'tribunal_records') {
        return (await api.getTribunalRecords(true)) as unknown as T;
      }
      if (moduleKey === 'highcourt_records') {
        return (await api.getHighCourtRecords(true)) as unknown as T;
      }
      if (moduleKey === 'gst_registrations') {
        return (await api.getGSTRegistrations(true)) as unknown as T;
      }
      if (moduleKey === 'food_licenses') {
        return (await api.getFoodLicenses(true)) as unknown as T;
      }
      if (moduleKey === 'msme_registrations') {
        return (await api.getMSMERegistrations(true)) as unknown as T;
      }
      if (moduleKey === 'invoices') {
        return (await api.getInvoices()) as unknown as T;
      }
      if (moduleKey === 'payments') {
        return (await api.getPayments()) as unknown as T;
      }
      if (moduleKey === 'invoice_settings') {
        return (await api.getInvoiceSettings()) as unknown as T;
      }
      if (moduleKey === 'messenger_clients') {
        const section = clientId || 'All';
        switch (section) {
          case 'All': return (await api.getMessengerClientsAll()) as unknown as T;
          case 'GST': return (await api.getMessengerClientsGst()) as unknown as T;
          case 'ITR': return (await api.getMessengerClientsItr()) as unknown as T;
          case 'Audit': return (await api.getMessengerClientsAudit()) as unknown as T;
          case 'GSTR-4': return (await api.getMessengerClientsGstr4()) as unknown as T;
          case 'GSTR-9/9C': return (await api.getMessengerClientsGstr9()) as unknown as T;
          default: return (await api.getMessengerClientsAll()) as unknown as T;
        }
      }
      if (moduleKey === 'reminders_data') {
        const filter = clientId || 'All';
        if (filter === 'Litigation') {
          const litigation = await api.getRemindersLitigation();
          const mappedLit = litigation.map((r: any) => ({
            id: r.id,
            title: `${r.category} - ${r.section ? `U/s ${r.section}` : r.referenceNo}`,
            client: r.clientName,
            date: r.dueDate,
            category: r.category,
            priority: 'High',
            status: 'Response Due',
            origin: 'litigation'
          }));
          return mappedLit.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as unknown as T;
        }
        if (filter === 'Misc Work') {
          const work = await api.getRemindersMiscWork();
          const mappedWork = work.map((w: any) => ({
            id: w.id,
            title: w.workType || w.description || 'Misc Work',
            client: w.clientName || 'Client',
            date: w.targetDate || w.dueDate || w.startDate || new Date().toISOString(),
            category: 'MISC WORK',
            priority: w.priority || 'Medium',
            status: w.status,
            origin: 'work'
          }));
          return mappedWork.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as unknown as T;
        }
        if (filter === 'Food License' || filter === 'Food License Renewal') {
          const licenses = await api.getFoodLicenses();
          const validLicenses = (licenses || []).filter((l: any) => l.expiryDate || l.dueDate);
          const mappedFood = validLicenses.map((l: any) => {
            const renewalDue = l.dueDate || (l.expiryDate ? calculateRenewalDueDate(l.expiryDate) : '');
            return {
              id: l.id,
              title: `FSSAI Renewal - ${l.licenseType}${l.licenseNo ? ` (${l.licenseNo})` : ''}`,
              client: l.clientName || 'Client',
              date: renewalDue || l.expiryDate || new Date().toISOString(),
              category: 'FOOD LICENSE',
              priority: 'High',
              status: 'Renewal Due',
              origin: 'food_license',
              expiryDate: l.expiryDate
            };
          });
          return mappedFood.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as unknown as T;
        }
        if (filter === 'Statutory Deadlines' || filter === 'Statutory') {
          const statutory = getAllStatutoryDeadlines(false);
          return statutory as unknown as T;
        }
        const [litigation, work, licenses] = await Promise.all([
          api.getRemindersLitigation().catch(() => []),
          api.getRemindersMiscWork().catch(() => []),
          api.getFoodLicenses().catch(() => [])
        ]);
        const statutory = getAllStatutoryDeadlines(false);
        const mappedLit = litigation.map((r: any) => ({
          id: r.id,
          title: `${r.category} - ${r.section ? `U/s ${r.section}` : r.referenceNo}`,
          client: r.clientName,
          date: r.dueDate,
          category: r.category,
          priority: 'High',
          status: 'Response Due',
          origin: 'litigation'
        }));
        const mappedWork = work.map((w: any) => ({
          id: w.id,
          title: w.workType || w.description || 'Misc Work',
          client: w.clientName || 'Client',
          date: w.targetDate || w.dueDate || w.startDate || new Date().toISOString(),
          category: 'MISC WORK',
          priority: w.priority || 'Medium',
          status: w.status,
          origin: 'work'
        }));
        const validLicenses = (licenses || []).filter((l: any) => l.expiryDate || l.dueDate);
        const mappedFood = validLicenses.map((l: any) => {
          const renewalDue = l.dueDate || (l.expiryDate ? calculateRenewalDueDate(l.expiryDate) : '');
          return {
            id: l.id,
            title: `FSSAI Renewal - ${l.licenseType}${l.licenseNo ? ` (${l.licenseNo})` : ''}`,
            client: l.clientName || 'Client',
            date: renewalDue || l.expiryDate || new Date().toISOString(),
            category: 'FOOD LICENSE',
            priority: 'High',
            status: 'Renewal Due',
            origin: 'food_license',
            expiryDate: l.expiryDate
          };
        });
        const combined = [...statutory, ...mappedLit, ...mappedWork, ...mappedFood];
        return combined.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as unknown as T;
      }
      const items = await api.getItemsByCategory(moduleKey, false);
      if (clientId && Array.isArray(items)) {
        return items.filter((item: any) => 
          item.clientId === clientId || 
          item.client_id === clientId || 
          item.data?.clientId === clientId
        ) as unknown as T;
      }
      return items as unknown as T;
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  });
}


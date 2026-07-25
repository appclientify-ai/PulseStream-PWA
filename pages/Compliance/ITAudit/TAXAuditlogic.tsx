import { socketService } from '../../../services/socket.ts';
import { useState, useCallback, useEffect } from 'react';
import { api } from '../../../services/api';

export type BSStatus = 'Document Required' | 'In progress' | 'Ready' | 'Pending';

export interface AuditFinancialStatus {
  remark?: string;
  bsStatus: BSStatus;
  auditFiled: boolean;
  caName?: string;
  bsDate?: string;
  auditDate?: string;
}

const STORAGE_KEY_DATA = 'clientify_audit_fin_data_v3';
const STORAGE_KEY_WATCHLIST = 'clientify_audit_watchlist_v3';
const STORAGE_KEY_DATES = 'clientify_audit_due_dates_v1';

export const useTaxAuditLogic = (selectedYear: string) => {
  const [watchlist, setWatchlist] = useState<Record<string, string[]>>({});
  const [allData, setAllData] = useState<Record<string, Record<string, AuditFinancialStatus>>>({});
  const [dueDates, setDueDates] = useState<Record<string, string>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [w, d, dates] = await Promise.all([
          api.getAppData(STORAGE_KEY_WATCHLIST),
          api.getAppData(STORAGE_KEY_DATA),
          api.getAppData(STORAGE_KEY_DATES)
        ]);
        if (w) setWatchlist(w);
        if (d) setAllData(d);
        if (dates) setDueDates(dates);
      } catch (err) {
        console.error(err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    load();
    const syncHandler = () => load();
    window.addEventListener('clientify_db_change', syncHandler);
    return () => window.removeEventListener('clientify_db_change', syncHandler);
  }, []);

  const yearWatchlist = watchlist[selectedYear] || [];

  const addToWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const current = prev[selectedYear] || [];
      if (current.includes(clientId)) return prev;
      const next = { ...prev, [selectedYear]: [...current, clientId] };
      api.patchAppData(STORAGE_KEY_WATCHLIST, { [`data.${selectedYear}`]: next[selectedYear] }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const removeFromWatchlist = useCallback((clientId: string) => {
    setWatchlist(prev => {
      const next: Record<string, string[]> = {};
      Object.keys(prev).forEach(year => {
        next[year] = prev[year].filter(id => id !== clientId);
      });
      api.patchAppData(STORAGE_KEY_WATCHLIST, { "data": next }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, []);

  const toggleAuditStatus = useCallback((clientId: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
      
      clientData.auditFiled = !clientData.auditFiled;
      if (clientData.auditFiled) {
        clientData.auditDate = new Date().toISOString().split('T')[0];
      } else {
        delete clientData.auditDate;
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const setBSStatus = useCallback((clientId: string, status: BSStatus) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
      
      clientData.bsStatus = status;
      if (status === 'Ready') {
        clientData.bsDate = new Date().toISOString().split('T')[0];
      }
      
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const updateCaName = useCallback((clientId: string, name: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }) };
      clientData.caName = name;
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}`]: clientData }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const getStatus = useCallback((clientId: string): AuditFinancialStatus => {
    return (allData[selectedYear] || {})[clientId] || { bsStatus: 'Pending', auditFiled: false };
  }, [allData, selectedYear]);

  const updateRemark = useCallback((clientId: string, val: string) => {
    setAllData(prev => {
      const yearData = { ...(prev[selectedYear] || {}) };
      const clientData = { ...(yearData[clientId] || { bsStatus: 'Pending', auditFiled: false }), remark: val };
      yearData[clientId] = clientData;
      const next = { ...prev, [selectedYear]: yearData };
      api.patchAppData(STORAGE_KEY_DATA, { [`data.${selectedYear}.${clientId}.remark`]: val }).then(() => socketService.emit('data_updated')).catch(console.error);
      return next;
    });
  }, [selectedYear]);

  const updateDueDate = (val: string) => {
    const next = { ...dueDates, [selectedYear]: val };
    setDueDates(next);
    api.patchAppData(STORAGE_KEY_DATES, { [`data.${selectedYear}`]: val }).then(() => socketService.emit('data_updated')).catch(console.error);
  };

  const getDueDate = () => dueDates[selectedYear] || '';

  return { getStatus, toggleAuditStatus, setBSStatus, updateCaName, updateRemark, updateDueDate, getDueDate, watchlist, yearWatchlist, addToWatchlist, removeFromWatchlist, isDataLoaded };
};
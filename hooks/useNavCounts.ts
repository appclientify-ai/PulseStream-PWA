import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';

export function useNavCounts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleDbChange = () => {
      queryClient.invalidateQueries({ queryKey: ['nav_counts'] });
    };
    window.addEventListener('clientify_db_change', handleDbChange);
    return () => window.removeEventListener('clientify_db_change', handleDbChange);
  }, [queryClient]);

  return useQuery({
    queryKey: ['nav_counts'],
    queryFn: async () => {
      const [
        gstRegs,
        foodLics,
        msmes,
        works,
        msgs,
        rems,
        invs,
        pmts
      ] = await Promise.all([
        api.getGSTRegistrations().catch(() => []),
        api.getFoodLicenses().catch(() => []),
        api.getMSMERegistrations().catch(() => []),
        api.getMiscWork().catch(() => []),
        api.getMessengerClientsAll().catch(() => []),
        api.getRemindersAll().catch(() => ({ litigation: [], work: [] })),
        api.getInvoices().catch(() => []),
        api.getPayments().catch(() => [])
      ]);

      const remCount = (rems?.litigation?.length || 0) + (rems?.work?.length || 0);

      return {
        'misc-gst-reg': gstRegs.length,
        'misc-food-lic': foodLics.length,
        'misc-msme': msmes.length,
        'misc-work': works.length,
        'messenger': msgs.length,
        'reminders': remCount,
        'admin-invoices': invs.length,
        'admin-payments': pmts.length,
      } as Record<string, number>;
    },
    staleTime: 1000 * 30,
  });
}

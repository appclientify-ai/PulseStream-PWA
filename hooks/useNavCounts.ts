import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';
import { calculateRenewalDueDate } from '../dateUtils.ts';

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
      const rems = await api.getRemindersAll().catch(() => ({ litigation: [], work: [], foodLicenses: [] }));

      const getDaysLeft = (dueDateStr?: string) => {
        if (!dueDateStr) return 999;
        const due = new Date(dueDateStr);
        if (isNaN(due.getTime())) return 999;
        due.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      };

      const urgentLit = (rems?.litigation || []).filter((r: any) => getDaysLeft(r.dueDate) <= 15);
      const urgentWork = (rems?.work || []).filter((w: any) => getDaysLeft(w.targetDate || w.dueDate || w.startDate) <= 15);
      const urgentFood = (rems?.foodLicenses || []).filter((f: any) => {
        const renewalDue = f.dueDate || (f.expiryDate ? calculateRenewalDueDate(f.expiryDate) : '');
        const daysToTarget = getDaysLeft(renewalDue);
        const daysToExpiry = getDaysLeft(f.expiryDate);
        return daysToTarget <= 15 || daysToExpiry <= 60;
      });

      const remCount = urgentLit.length + urgentWork.length + urgentFood.length;

      return {
        'reminders': remCount,
      } as Record<string, number>;
    },
    staleTime: 1000 * 30,
  });
}

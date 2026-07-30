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
      const rems = await api.getRemindersAll().catch(() => ({ litigation: [], work: [] }));
      const remCount = (rems?.litigation?.length || 0) + (rems?.work?.length || 0);

      return {
        'reminders': remCount,
      } as Record<string, number>;
    },
    staleTime: 1000 * 30,
  });
}

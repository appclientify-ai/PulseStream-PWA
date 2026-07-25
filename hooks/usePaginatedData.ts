import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../services/api.ts';
import { InvoiceRecord } from '../types.ts';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function usePaginatedCategory<T>(category: string, page = 1, limit = 25, search = '') {
  return useQuery<PaginatedResult<T>>({
    queryKey: ['category_items', category, page, limit, search],
    queryFn: () => api.getPaginatedCategory<T>(category, page, limit, search),
    placeholderData: keepPreviousData,
    staleTime: 0, // 3 minutes cache
  });
}

export function usePaginatedInvoices(page = 1, limit = 25, search = '') {
  return usePaginatedCategory<any>('invoice', page, limit, search);
}

export function usePaginatedClients(page = 1, limit = 25, search = '') {
  return usePaginatedCategory<any>('client', page, limit, search);
}

// Optimistic mutation hook for updating Invoice status and details
export function useUpdateInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updatedInvoice: InvoiceRecord) => api.saveInvoice(updatedInvoice),
    onMutate: async (updatedInvoice: InvoiceRecord) => {
      await queryClient.cancelQueries({ queryKey: ['category_items', 'invoice'] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ['category_items', 'invoice'] });

      queryClient.setQueriesData<PaginatedResult<InvoiceRecord>>({ queryKey: ['category_items', 'invoice'] }, (old) => {
        if (!old || !old.items) return old;
        return {
          ...old,
          items: old.items.map((inv) => (inv.id === updatedInvoice.id ? { ...inv, ...updatedInvoice } : inv)),
        };
      });

      return { previousQueries };
    },
    onError: (_err, _updatedInvoice, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
    },
    onSettled: () => {
      api.invalidateCache();
      queryClient.invalidateQueries({ queryKey: ['category_items', 'invoice'] });
    },
  });
}

// Optimistic mutation hook for deleting an invoice
export function useDeleteInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteInvoice(id),
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({ queryKey: ['category_items', 'invoice'] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ['category_items', 'invoice'] });

      queryClient.setQueriesData<PaginatedResult<InvoiceRecord>>({ queryKey: ['category_items', 'invoice'] }, (old) => {
        if (!old || !old.items) return old;
        return {
          ...old,
          items: old.items.filter((inv) => inv.id !== deletedId),
          total: Math.max(0, old.total - 1),
        };
      });

      return { previousQueries };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
    },
    onSettled: () => {
      api.invalidateCache();
      queryClient.invalidateQueries({ queryKey: ['category_items', 'invoice'] });
    },
  });
}

// Optimistic mutation hook for payment settlement
export function useSettleInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentData }: { id: string; paymentData: any }) => api.migrateToPayment(id, paymentData),
    onMutate: async ({ id, paymentData }) => {
      await queryClient.cancelQueries({ queryKey: ['category_items', 'invoice'] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ['category_items', 'invoice'] });

      queryClient.setQueriesData<PaginatedResult<InvoiceRecord>>({ queryKey: ['category_items', 'invoice'] }, (old) => {
        if (!old || !old.items) return old;
        return {
          ...old,
          items: old.items.map((inv) => {
            if (inv.id === id) {
              const newPaid = (inv.amountPaid || 0) + Number(paymentData.amount || 0);
              const isFull = newPaid >= inv.totalAmount;
              return {
                ...inv,
                amountPaid: newPaid,
                balanceDue: Math.max(0, inv.totalAmount - newPaid),
                status: isFull ? 'Paid' : 'Partial',
              };
            }
            return inv;
          }),
        };
      });

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
    },
    onSettled: () => {
      api.invalidateCache();
      queryClient.invalidateQueries({ queryKey: ['category_items', 'invoice'] });
      queryClient.invalidateQueries({ queryKey: ['category_items', 'payment'] });
    },
  });
}

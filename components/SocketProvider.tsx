import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import { api } from '../services/api';

const SocketContext = createContext<typeof socketService | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    socketService.connect();

    const handleSync = (event?: any) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (event && event.module) {
          api.invalidateCache(event.module);
          if (event.clientId) {
            queryClient.invalidateQueries({ queryKey: [event.module, event.clientId] });
          }
          queryClient.invalidateQueries({ queryKey: [event.module] });
          queryClient.invalidateQueries({ queryKey: ['category_items', event.module] });
        } else if (event?.data?.name) {
          const name = event.data.name;
          api.invalidateCache(name);
          queryClient.invalidateQueries({ queryKey: [name] });
          queryClient.invalidateQueries({ queryKey: ['category_items', name] });
          if (name === 'client') {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['monthly_filing_page_data'] });
            queryClient.invalidateQueries({ queryKey: ['quarterly_filing_page_data'] });
          }
        }
      }, 200);
    };

    socketService.on('DATA_MUTATED', handleSync);
    socketService.on('db_item_change', handleSync);
    socketService.on('item_created', handleSync);
    socketService.on('item_updated', handleSync);
    socketService.on('item_deleted', handleSync);

    const onDbChange = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv?.detail?.data?.name) {
        handleSync(customEv.detail);
      }
    };

    window.addEventListener('clientify_db_change', onDbChange);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      window.removeEventListener('clientify_db_change', onDbChange);
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);


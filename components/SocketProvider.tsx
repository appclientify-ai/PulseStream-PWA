import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import { api } from '../services/api';

const SocketContext = createContext<typeof socketService | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    socketService.connect();

    const handleSync = (event?: any) => {
      api.invalidateCache();
      if (event && event.module) {
        if (event.clientId) {
          queryClient.invalidateQueries({ queryKey: [event.module, event.clientId] });
        }
        queryClient.invalidateQueries({ queryKey: [event.module] });
        queryClient.invalidateQueries({ queryKey: ['category_items', event.module] });
      }
      // Instantly trigger re-fetch of all active queries currently on screen
      queryClient.invalidateQueries({ refetchType: 'active' });
    };

    socketService.on('filing_single_updated', handleSync);
    socketService.on('DATA_MUTATED', handleSync);
    socketService.on('db_item_change', handleSync);
    socketService.on('item_created', handleSync);
    socketService.on('item_updated', handleSync);
    socketService.on('item_deleted', handleSync);
    socketService.on('sync_data', handleSync);

    const onDbChange = (e: Event) => {
      const customEv = e as CustomEvent;
      handleSync(customEv.detail);
    };

    window.addEventListener('clientify_db_change', onDbChange);
    return () => {
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


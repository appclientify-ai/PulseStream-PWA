import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket';

const SocketContext = createContext<typeof socketService | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    socketService.connect();

    const handleDataMutated = (event: { module?: string; clientId?: string; data?: any }) => {
      console.log('⚡ DATA_MUTATED event received:', event);
      if (event) {
        if (event.module && event.clientId) {
          queryClient.invalidateQueries({ queryKey: [event.module, event.clientId] });
        }
        if (event.module) {
          queryClient.invalidateQueries({ queryKey: [event.module] });
          queryClient.invalidateQueries({ queryKey: ['category_items', event.module] });
        }
      }
      queryClient.invalidateQueries({ refetchType: 'active' });
    };

    socketService.on('DATA_MUTATED', handleDataMutated);
  }, [queryClient]);

  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

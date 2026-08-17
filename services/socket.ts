
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { api } from './api';

class SocketService {
  private socket: Socket | null = null;
  private handlers: { [key: string]: ((...args: any[]) => void)[] } = {};

  connect() {
    if (this.socket && this.socket.connected) return;

    if (!this.socket) {
      try {
        this.socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
          timeout: 8000,
        } as any);

        this.socket.on('connect', () => {
          console.debug('⚡ Unified Vault Sync Connected');
          this.trigger('connect', {});
        });

        this.socket.onAny((event, ...args) => {
          this.trigger(event, args[0]);
        });

        const handleRealtimeChange = (payload: any) => {
          console.debug('⚡ Real-time update received:', payload);
          if (payload?.name) {
            api.invalidateCache(payload.name);
          } else if (payload?.storageKey) {
            api.invalidateCache('app_data_' + payload.storageKey);
          } else if (payload?.data?.name) {
            api.invalidateCache(payload.data.name);
          } else if (payload?.type === 'single_filing_update') {
            if (payload?.storageKey) {
              api.invalidateCache('app_data_' + payload.storageKey);
            }
          } else if (payload?.type === 'insert' || payload?.type === 'delete' || payload?.type === 'update') {
            if (payload?.data?.name) {
              api.invalidateCache(payload.data.name);
            }
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('clientify_db_change', { detail: payload }));
          }
        };

        this.socket.on('filing_single_updated', handleRealtimeChange);
        this.socket.on('db_item_change', handleRealtimeChange);
        this.socket.on('item_created', handleRealtimeChange);
        this.socket.on('item_updated', handleRealtimeChange);
        this.socket.on('item_deleted', handleRealtimeChange);
        this.socket.on('sync_data', handleRealtimeChange);
        this.socket.on('DATA_MUTATED', handleRealtimeChange);

        this.socket.on('disconnect', (reason) => {
          console.warn('🔌 Vault Sync Interrupted:', reason);
          this.trigger('disconnect', { reason });
        });

        // Reconnect automatically when returning to tab/window
        if (typeof window !== 'undefined') {
          window.addEventListener('focus', () => {
            if (this.socket && !this.socket.connected) {
              this.socket.connect();
            }
          });
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.socket && !this.socket.connected) {
              this.socket.connect();
            }
          });
        }
      } catch (e) {
        console.warn('Socket connection error. Real-time features may be limited.');
      }
    } else {
      this.socket.connect();
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(callback);
    this.socket?.on(event, callback);
  }

  private trigger(event: string, data: any) {
    this.handlers[event]?.forEach(cb => cb(data));
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.debug(`[Sync Delayed] ${event}`, data);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.handlers = {};
  }
}

export const socketService = new SocketService();


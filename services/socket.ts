
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';

class SocketService {
  private socket: Socket | null = null;
  private handlers: { [key: string]: Function[] } = {};

  connect() {
    if (this.socket) return;
    
    try {
      // Fix: Added 'as any' to io options to bypass the transports type error
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      } as any);

      this.socket.on('connect', () => {
        console.debug('⚡ Unified Vault Sync Connected');
        this.trigger('connect', {});
      });

      this.socket.onAny((event, ...args) => {
        this.trigger(event, args[0]);
      });

      this.socket.on('disconnect', () => {
        console.warn('🔌 Vault Sync Interrupted');
        this.trigger('disconnect', {});
      });

    } catch (e) {
      console.warn('Socket connection error. Real-time features may be limited.');
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

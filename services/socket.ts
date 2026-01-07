
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';

class SocketService {
  private socket: Socket | null = null;
  private handlers: { [key: string]: Function[] } = {};

  connect() {
    if (!SOCKET_URL || SOCKET_URL.includes('localhost') && !window.location.hostname.includes('localhost')) {
        console.debug('SocketService: Connection deferred (waiting for valid backend URL)');
        return;
    }
    
    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.debug('Socket Connected to Cloud Vault');
        this.trigger('connect', {});
      });

      this.socket.onAny((event, ...args) => {
        this.trigger(event, args[0]);
      });

    } catch (e) {
      console.error('Socket connection fatal error:', e);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(callback);
  }

  private trigger(event: string, data: any) {
    this.handlers[event]?.forEach(cb => cb(data));
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected. Cannot emit ${event}`);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();

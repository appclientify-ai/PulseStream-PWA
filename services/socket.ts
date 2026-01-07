
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { api } from './api';

class SocketService {
  private socket: Socket | null = null;
  private handlers: { [key: string]: Function[] } = {};

  connect() {
    if (api.isMockMode || !SOCKET_URL || SOCKET_URL.includes('example.com')) {
        console.debug('SocketService: Initializing local simulation.');
        this.simulateConnection();
        return;
    }
    
    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.debug('Socket Connected to Server');
        this.trigger('connect', {});
      });

      this.socket.onAny((event, ...args) => {
        this.trigger(event, args[0]);
      });

    } catch (e) {
      console.warn('Socket connection error, falling back to simulation.');
      this.simulateConnection();
    }
  }

  private simulateConnection() {
    setTimeout(() => this.trigger('connect', {}), 500);
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
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.debug(`[Mock Socket] Emit ${event}`, data);
      
      // Simulation Logic
      if (event === 'message') {
        // Echo back for UI feedback
        setTimeout(() => {
          this.trigger('message', {
            id: `mock_reply_${Date.now()}`,
            sender: 'VaultBot',
            content: `I received: "${data.content}". This is a real-time simulation.`,
            timestamp: Date.now()
          });
        }, 1000);
      }
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();

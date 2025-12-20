
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../constants';
import { SocketEvent } from '../types';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    // In a real environment, this connects to BACKEND_URL.
    // Since we don't have a real backend, we'll simulate the socket behavior if the URL is mock.
    if (BACKEND_URL.includes('example.com')) {
        console.warn('SocketService: Using simulated real-time events.');
        return;
    }

    this.socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();

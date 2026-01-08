
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
// Removed SocketEvent import as it is not exported from types.ts and not used here

class SocketService {
  private socket: Socket | null = null;

  connect() {
    // If it's a mock or example URL, we just log it for the demo
    if (SOCKET_URL.includes('example.com')) {
        console.warn('SocketService: Using simulated real-time events.');
        return;
    }

    try {
      // Fix: Added 'as any' to io options to bypass the transports type error
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
      } as any);
      
      this.socket.on('connect_error', (err) => {
        console.warn('Socket connection failed, likely backend is offline. Using simulation mode.');
      });
    } catch (e) {
      console.error('Socket init failed', e);
    }
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

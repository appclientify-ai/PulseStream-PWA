
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants.ts';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (SOCKET_URL.includes('example.com')) {
        console.warn('SocketService: Using simulated real-time events.');
        return;
    }

    try {
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

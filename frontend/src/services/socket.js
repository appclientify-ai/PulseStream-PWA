
import { io } from 'socket.io-client';

const BACKEND_URL = (import.meta).env?.VITE_BACKEND_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    this.socket = io(BACKEND_URL, {
      transports: ['websocket']
    });
  }

  on(event, cb) {
    this.socket?.on(event, cb);
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();

import { Server } from 'socket.io';

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Whitelist your frontend URL in production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('⚡ Practitioner Connected:', socket.id);

    // Join a room based on firm/user ID could be added for targeted sync
    
    socket.on('message', (data) => {
      // Broadcast chat messages to all connected sessions
      io.emit('message', {
        ...data,
        id: `msg_${Date.now()}`,
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Practitioner Disconnected');
    });
  });

  return io;
}

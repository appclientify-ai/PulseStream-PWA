
import 'dotenv/config';
import http from 'http';
import { app } from './app.js';
import { initSocket } from './sockets/socket.js';
import { connectDB, client } from './db/mongo.js';
import { initChangeStreams } from './db/streams.js';

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
app.set('io', io);

const startServer = async () => {
  console.log('🔄 STARTING CLIENTIFY BACKEND...');
  
  try {
    await connectDB();
    initChangeStreams(io);
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SERVER IS LIVE: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ FATAL ERROR DURING STARTUP:', err.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  server.close(async () => {
    try {
      await client.close();
      console.log('🔌 MongoDB connection closed.');
    } catch(e) {}
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

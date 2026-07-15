
import 'dotenv/config';
import http from 'http';
import { app } from './app.js';
import { initSocket } from './sockets/socket.js';
import { connectDB, client } from './db/mongo.js';
import { initChangeStreams } from './db/streams.js';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
app.set('io', io);

const startServer = async () => {
  console.log('-------------------------------------------');
  console.log('🔄 STARTING CLIENTIFY BACKEND...');
  console.log('-------------------------------------------');
  
  try {
    // Attempt to connect to the database
    // This will throw and exit if MONGODB_URI is invalid
    await connectDB();
    
    // Start watching database changes for real-time reactivity
    initChangeStreams(io);
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 SERVER IS LIVE: http://localhost:${PORT}`);
      console.log(`🏥 HEALTH CHECK: http://localhost:${PORT}/health`);
      console.log('-------------------------------------------');
    });
  } catch (err) {
    console.error('❌ FATAL ERROR DURING STARTUP:');
    console.error(err.message);
    console.log('-------------------------------------------');
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    try {
      await client.close();
      console.log('🔌 MongoDB connection closed.');
    } catch(e) {}
    console.log('👋 Backend process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

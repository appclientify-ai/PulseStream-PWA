
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
  console.log('🔄 Starting Clientify Server...');
  try {
    // Add a race condition to ensure the DB connection doesn't block startup forever
    const dbPromise = connectDB();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB Connection Timeout')), 15000)
    );

    await Promise.race([dbPromise, timeoutPromise]);
    
    // Start watching database changes for real-time reactivity
    initChangeStreams(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health check at http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server correctly:', err.message);
    
    // Attempt to start server anyway if in dev mode to allow UI debugging
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Server starting in DEMO/OFFLINE mode due to DB failure.');
      server.listen(PORT, () => {
        console.log(`🚀 Server (DEMO MODE) running on port ${PORT}`);
      });
    } else {
      process.exit(1);
    }
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('Stopping server...');
  server.close(async () => {
    try {
      await client.close();
    } catch(e) {}
    console.log('Database connection closed. Exit.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

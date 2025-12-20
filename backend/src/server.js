
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
  try {
    await connectDB();
    
    // Start watching database changes for real-time reactivity
    initChangeStreams(io);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Health check at http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('Stopping server...');
  server.close(async () => {
    await client.close();
    console.log('Database connection closed. Exit.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './db/mongo.js';
import itemRoutes from './routes/items.routes.js';
import authRoutes from './auth/auth.routes.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || '*' }
});

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'vault_online' }));

const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Vault API active on port ${PORT}`);
  });
};

start();

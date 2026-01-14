
import express from 'express';
import cors from 'cors';
import authRoutes from './auth/auth.routes.js';
import itemRoutes from './routes/items.routes.js';

export const app = express();

// Whitelist the frontend domain
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// Health check for Render/Heroku
app.get('/api/health', (req, res) => res.json({ status: 'live' }));

// Global Error Handler - CRITICAL: Always returns JSON
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ 
    error: true,
    message: err.message || 'Internal Vault Error' 
  });
});

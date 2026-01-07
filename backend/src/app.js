
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './auth/auth.routes.js';
import clientRoutes from './routes/clients.routes.js';
import invoiceRoutes from './routes/invoices.routes.js';
import litigationRoutes from './routes/litigation.routes.js';
import filingRoutes from './routes/filings.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middleware
app.use(cors({
  origin: '*', // Whitelist specific domains in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Allow for base64 logos/signatures

// 1. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/litigation', litigationRoutes);
app.use('/api/filings', filingRoutes);
app.use('/api/settings', settingsRoutes);

// 2. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 3. Static Assets (Production Build)
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

// 4. Catch-all for SPA Navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ 
        message: "API server is running. Frontend should be accessed via the Netlify URL.",
        health: "/api/health"
      });
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

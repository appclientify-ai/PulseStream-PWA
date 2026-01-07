
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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/litigation', litigationRoutes);
app.use('/api/filings', filingRoutes);
app.use('/api/settings', settingsRoutes);

// Shared Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: 'production', timestamp: new Date() });
});

const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Production API endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

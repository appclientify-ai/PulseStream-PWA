
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './auth/auth.routes.js';
import itemRoutes from './routes/items.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middleware
app.use(cors({
  origin: '*', // For production, specifically whitelist your Netlify URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. API Routes (PRIORITY)
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// 2. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

// 3. Serve Static Files (Only needed if running as a monolith on Render)
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

// 4. Catch-all for SPA Navigation
app.get('*', (req, res) => {
  // If it's a missed API call, return JSON 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }

  // Otherwise serve the index.html
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If we are on Netlify + Render, the backend won't have the dist folder.
      // This is expected. We return a JSON 404 for clarity.
      res.status(404).json({ 
        message: "API server is running. Frontend should be hosted separately.",
        docs: "/api/health"
      });
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

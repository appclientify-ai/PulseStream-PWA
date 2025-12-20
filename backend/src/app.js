
import express from 'express';
import cors from 'cors';
import authRoutes from './auth/auth.routes.js';
import itemRoutes from './routes/items.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

app.get('/health', (req, res) => res.send('OK'));

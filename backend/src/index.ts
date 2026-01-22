import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import { router as serviceRoutes } from './routes/service';
import { router as reserveRoutes } from './routes/reserve';
import { router as timeSlotRoutes } from './routes/timeSlot';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 設定
const getCorsOrigin = () => {
    const origin = process.env.CORS_ORIGIN;
    if (!origin) return ['http://localhost:3000', 'http://frontend:3000'];
    if (origin === '*') return true; // 允許所有來源
    return origin.split(',').map((o) => o.trim()); // 支援逗號分隔多來源
};

const corsOptions = {
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
    res.json({ message: 'Mega Line Reserve API' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/user', userRoutes);

// Service routes
app.use('/api/service', serviceRoutes);

// Reserve routes
app.use('/api/reserve', reserveRoutes);

// Time slot routes
app.use('/api/time-slot', timeSlotRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;

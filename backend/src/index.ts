import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 設定
const corsOptions = {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://frontend:3000'],
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
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);

// User routes
import userRoutes from './routes/user';
app.use('/api/user', userRoutes);

// Service routes
import { router as serviceRoutes } from './routes/service';
app.use('/api/service', serviceRoutes);

// Reserve routes
import { router as reserveRoutes } from './routes/reserve';
app.use('/api/reserve', reserveRoutes);

// Error handler (must be last)
import { errorHandler } from './middleware/errorHandler';
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;

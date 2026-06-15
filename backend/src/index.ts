import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// 信任反向代理：production 多半在 nginx / Cloud Run / LB 後面，
// 未設定時 express 會以代理 IP 作為 req.ip，導致 rate limit 全站共用同一桶且失效。
// 以 TRUST_PROXY 指定信任的代理層數（預設 production 1 層、開發環境關閉）。
const trustProxy = (() => {
    if (process.env.TRUST_PROXY) {
        const parsed = Number(process.env.TRUST_PROXY);
        if (Number.isFinite(parsed)) return parsed;
    }
    return process.env.NODE_ENV === 'production' ? 1 : false;
})();
app.set('trust proxy', trustProxy);

// CORS 設定
// 注意：因為 credentials: true，CORS_ORIGIN 不可設為 '*'
// （cors 套件的 origin: true 會反射請求來源，等同允許任何網站帶憑證呼叫 API，等同於 CSRF 漏洞）
const getCorsOrigin = () => {
    const origin = process.env.CORS_ORIGIN;
    if (!origin || origin === '*') {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CORS_ORIGIN 未設定或為 "*"：搭配 credentials 將允許任意網站帶憑證存取 API，請於 production 設定明確的來源網域');
        }
        return ['http://localhost:3000', 'http://frontend:3000'];
    }
    return origin.split(',').map((o) => o.trim()); // 支援逗號分隔多來源
};

const corsOptions = {
    origin: getCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// 安全標頭 (HSTS、X-Content-Type-Options 等)
app.use(helmet());

// 全域限流：避免單一來源過量請求
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 分鐘
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '請求過於頻繁，請稍後再試' },
});

// Middleware
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(compression());
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

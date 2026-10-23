import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { isIP } from 'node:net';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import { router as serviceRoutes } from './routes/service';
import { router as reserveRoutes } from './routes/reserve';
import { router as timeSlotRoutes } from './routes/timeSlot';
import { errorHandler } from './middleware/errorHandler';
import { getDirectPeerRateLimitKey } from './utils/rateLimit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const isExplicitProxyAddress = (entry: string): boolean => {
    const [address, prefix, extra] = entry.split('/');
    if (extra !== undefined) {
        return false;
    }

    const family = isIP(address);
    if (family === 0) {
        return false;
    }

    if (prefix === undefined) {
        return true;
    }

    if (!/^\d+$/.test(prefix)) {
        return false;
    }

    const prefixLength = Number(prefix);
    // /0 等同信任整個 IPv4 或 IPv6 網際網路，效果與 trust proxy=true 相近。
    return prefixLength > 0 && prefixLength <= (family === 4 ? 32 : 128);
};

// 預設不信任轉送標頭。Production 的 Next rewrite 會原樣保留用戶端提供的
// X-Forwarded-For；除非前方代理已明確覆寫／清理該標頭，否則不可啟用。
// production 禁止使用 hop count，因為不同網路路徑可能讓使用者成為受信任的一跳。
const getTrustProxy = (): boolean | number | string[] => {
    const value = process.env.TRUST_PROXY?.trim();
    if (!value || ['false', 'off', 'none'].includes(value.toLowerCase())) {
        return false;
    }

    if (/^\d+$/.test(value)) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Production 的 TRUST_PROXY 必須指定代理 IP/CIDR，不可使用 hop count');
        }
        return Number(value);
    }

    if (value.toLowerCase() === 'true') {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Production 不可將 TRUST_PROXY 設為 true，請指定代理 IP/CIDR');
        }
        return true;
    }

    const entries = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    if (process.env.NODE_ENV === 'production'
        && (entries.length === 0 || entries.some((entry) => !isExplicitProxyAddress(entry)))) {
        throw new Error('Production 的 TRUST_PROXY 只接受明確的代理 IP 或非 /0 CIDR');
    }

    return entries;
};

app.set('trust proxy', getTrustProxy());

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

// 全域總量保護：刻意使用實際 TCP 對端，不使用可偽造的 X-Forwarded-For。
// Production 流量都會由 Frontend 容器轉送，因此此限制是整個 API instance 的
// circuit breaker；登入端點另有總量與單一憑證限流。
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 分鐘
    limit: 3_000,
    keyGenerator: getDirectPeerRateLimitKey,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '請求過於頻繁，請稍後再試' },
});

// Middleware
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(compression());
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '100kb';
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit, parameterLimit: 100 }));

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

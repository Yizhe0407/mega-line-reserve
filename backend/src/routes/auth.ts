import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe } from '../controllers/auth';
import { authenticate, extractToken } from '../middleware/auth';

const router = Router();

// 限流：避免 /login 被暴力嘗試或灌爆 LINE token 驗證 API
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '請求過於頻繁，請稍後再試' },
});

// 登入 (自動建立用戶)
router.post('/login', loginLimiter, extractToken, login);

// 取得當前用戶資訊
router.get('/me', authenticate, getMe);

export default router;

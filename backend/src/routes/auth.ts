import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe } from '../controllers/auth';
import { authenticate, extractToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginBodySchema } from '../validation/auth';
import {
    getAuthorizationRateLimitKey,
    getDirectPeerRateLimitKey,
} from '../utils/rateLimit';

const router = Router();

// Next rewrite 不會補上真實來源 IP，因此先以實際 TCP 對端限制整體登入量，
// 防止攻擊者輪替偽造 X-Forwarded-For 或隨機 token 灌爆 LINE 驗證 API。
const loginAggregateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    limit: 300,
    keyGenerator: getDirectPeerRateLimitKey,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '請求過於頻繁，請稍後再試' },
});

// 相同憑證短時間內只允許有限次登入，限流儲存區只保留 token 雜湊。
const loginCredentialLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    keyGenerator: getAuthorizationRateLimitKey,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: '登入嘗試過於頻繁，請稍後再試' },
});

// 登入 (自動建立用戶)
router.post(
    '/login',
    loginAggregateLimiter,
    loginCredentialLimiter,
    extractToken,
    validateBody(loginBodySchema),
    login,
);

// 取得當前用戶資訊
router.get('/me', authenticate, getMe);

export default router;

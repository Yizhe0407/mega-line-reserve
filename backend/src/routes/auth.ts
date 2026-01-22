import { Router } from 'express';
import { login, getMe } from '../controllers/auth';
import { authenticate, extractToken } from '../middleware/auth';

const router = Router();

// 登入 (自動建立用戶)
router.post('/login', extractToken, login);

// 取得當前用戶資訊
router.get('/me', authenticate, getMe);

export default router;

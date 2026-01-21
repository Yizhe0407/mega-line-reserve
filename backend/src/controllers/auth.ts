import { Response, NextFunction } from 'express';
import * as authService from '../services/auth';
import { AuthRequest } from '../types/express';

/**
 * 登入 (自動建立用戶)
 * POST /api/auth/login
 */
export const login = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const { phone, license } = req.body;

    // 呼叫 service 處理業務邏輯（accessToken 已由 middleware 驗證並提取）
    authService.loginOrRegister(req.accessToken!, phone, license)
        .then((user) => {
            res.json({
                message: '登入成功',
                user: {
                    id: user.id,
                    lineId: user.lineId,
                    name: user.name,
                    pictureUrl: user.pictureUrl,
                    phone: user.phone,
                    license: user.license,
                    role: user.role,
                }
            });
        })
        .catch(next);
};

/**
 * 取得當前用戶資訊
 * GET /api/auth/me
 */
export const getMe = (req: AuthRequest, res: Response, next: NextFunction): void => {
    res.json({
        user: req.user
    });
};

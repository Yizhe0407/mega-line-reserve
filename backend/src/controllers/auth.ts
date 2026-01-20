import { Response } from 'express';
import * as authService from '../services/auth';
import { AuthRequest } from '../types/express';
import { NewUserError, ValidationError } from '../types/errors';

/**
 * 登入 (自動建立用戶)
 * POST /api/auth/login
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, license } = req.body;

        // 呼叫 service 處理業務邏輯（accessToken 已由 middleware 驗證並提取）
        const user = await authService.loginOrRegister(req.accessToken!, phone, license);

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
    } catch (error) {
        // 處理新用戶錯誤
        if (error instanceof NewUserError) {
            res.status(400).json({ 
                error: error.message,
                isNewUser: true,
                lineProfile: error.lineProfile
            });
            return;
        }

        // 處理驗證錯誤
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }

        // 其他錯誤
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : '登入過程發生錯誤';
        res.status(500).json({ error: errorMessage });
    }
};

/**
 * 取得當前用戶資訊
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    res.json({
        user: req.user
    });
};

import { Response, NextFunction } from 'express';
import { UserRole } from "@prisma/client";
import * as authService from '../services/auth';
import { AuthRequest } from '../types/express';

/**
 * 提取並驗證 Bearer Token (id_token)
 */
export const extractToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: '未提供認證 token' });
        return;
    }

    req.idToken = authHeader.substring(7);
    next();
};


/**
 * 驗證 LINE ID Token 並取得用戶資訊
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 如果沒有 idToken，先提取
        if (!req.idToken) {
            extractToken(req, res, () => {});
            if (!req.idToken) return;
        }

        // 使用 service 驗證用戶
        const user = await authService.authenticateUser(req.idToken);

        // 附加用戶資訊到 request
        req.user = {
            id: user.id,
            lineId: user.lineId,
            name: user.name || '',
            pictureUrl: user.pictureUrl || '',
            phone: user.phone,
            license: user.license || '',
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        const errorMessage = error instanceof Error ? error.message : '認證過程發生錯誤';
        const statusCode = errorMessage.includes('不存在') ? 401 : 500;
        res.status(statusCode).json({ error: errorMessage });
    }
};

/**
 * 角色權限檢查中間件
 */
export const checkRole = (role: UserRole) => (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ error: '未認證' });
        return;
    }

    if (req.user.role !== role && req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: '權限不足' });
        return;
    }

    next();
};
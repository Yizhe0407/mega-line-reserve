import { Response, NextFunction } from 'express';
import { UserRole } from "@prisma/client";
import * as authService from '../services/auth';
import { AuthRequest } from '../types/express';

const MAX_BEARER_TOKEN_LENGTH = 8_192;

const disableSensitiveResponseCaching = (res: Response): void => {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
};

/**
 * 提取並驗證 Bearer Token（id_token）
 */
export const extractToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    disableSensitiveResponseCaching(res);
    const authHeader = req.headers.authorization;
    const match = typeof authHeader === 'string'
        ? /^Bearer ([^\s]+)$/i.exec(authHeader)
        : null;

    if (!match || match[1].length > MAX_BEARER_TOKEN_LENGTH) {
        res.status(401).json({ error: '未提供認證 token' });
        return;
    }

    req.idToken = match[1];
    next();
};

/**
 * 驗證 LINE ID Token 並取得用戶資訊
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    disableSensitiveResponseCaching(res);
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
        // 不記錄完整錯誤物件，避免 Axios config 內的 id_token 或 Authorization 外洩。
        next(error);
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

type UserIdentifierParam = 'id' | 'lineId';

/**
 * 僅允許使用者讀取自己的資料；ADMIN 可查詢任意使用者。
 */
export const checkSelfOrAdmin = (paramName: UserIdentifierParam) => (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: '未認證' });
        return;
    }

    if (req.user.role === UserRole.ADMIN) {
        next();
        return;
    }

    const routeParam = req.params[paramName];
    const requestedIdentifier = (Array.isArray(routeParam) ? routeParam[0] : routeParam) ?? '';
    const isSelf = paramName === 'id'
        ? /^\d+$/.test(requestedIdentifier) && Number(requestedIdentifier) === req.user.id
        : requestedIdentifier === req.user.lineId;

    if (!isSelf) {
        res.status(403).json({ error: '您只能查詢自己的個人資訊' });
        return;
    }

    next();
};

import { Request } from 'express';

/**
 * 從 Authorization header 提取 Bearer token
 */
export const extractBearerToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    return authHeader.substring(7);
};

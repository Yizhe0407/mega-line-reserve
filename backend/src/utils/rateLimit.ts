import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';

/**
 * 以實際 TCP 對端建立限流鍵，不採信可由用戶端偽造的轉送標頭。
 *
 * Production 的 API 只接受 Next.js 容器轉送，而 Next rewrite 會原樣保留
 * X-Forwarded-For，因此這個鍵刻意不使用 req.ip。
 */
export const getDirectPeerRateLimitKey = (req: Request): string => {
    const remoteAddress = req.socket.remoteAddress ?? 'unknown';
    return `peer:${ipKeyGenerator(remoteAddress)}`;
};

/**
 * 以 Authorization header 的雜湊建立憑證限流鍵，避免 token 明文留在限流儲存區。
 */
export const getAuthorizationRateLimitKey = (req: Request): string => {
    const authorization = req.get('authorization');
    if (!authorization) {
        return `missing:${getDirectPeerRateLimitKey(req)}`;
    }

    // Bearer scheme 不分大小寫；有效格式只雜湊 token 本身，避免攻擊者透過改變
    // "Bearer" 大小寫繞過相同憑證的限流。格式錯誤的 header 仍只保存雜湊。
    const bearerMatch = /^Bearer ([^\s]+)$/i.exec(authorization);
    const keyMaterial = bearerMatch?.[1] ?? authorization;
    const keyType = bearerMatch ? 'bearer' : 'malformed';
    const digest = createHash('sha256').update(keyMaterial).digest('hex');
    return `${keyType}:${digest}`;
};

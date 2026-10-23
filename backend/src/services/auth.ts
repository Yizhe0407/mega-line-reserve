import axios from 'axios';
import { createHash } from 'crypto';
import * as userModel from '../model/user';
import { Prisma, UserRole } from '@prisma/client';
import { CreateUserDTO } from '../types/user';
import {
    NewUserError,
    ValidationError,
    AuthenticationError,
    ServiceUnavailableError,
} from '../types/errors';
import { isValidLicense, normalizeLicense } from '../utils/validators';
import { clearCache, getCache, setCache } from '../utils/cache';

const LINE_VERIFY_TIMEOUT_MS = 4_000;
const LINE_TOKEN_CACHE_MAX_TTL_MS = 5 * 60 * 1_000;
const LINE_TOKEN_CACHE_EXPIRY_SAFETY_MS = 1_000;

// LINE ID Token 驗證回應介面
interface LineIdTokenVerifyResponse {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    amr?: string[];
    name?: string;
    picture?: string;
    email?: string;
}

const isTokenUnexpired = (tokenInfo: LineIdTokenVerifyResponse, nowMs = Date.now()): boolean => {
    return Number.isFinite(tokenInfo.exp) && tokenInfo.exp * 1_000 > nowMs;
};

/**
 * 僅記錄排查外部服務所需的安全欄位，不輸出 request config、token 或回應內容。
 */
const logLineVerificationFailure = (error: unknown): void => {
    if (!axios.isAxiosError(error)) return;

    console.warn('[LINE token 驗證] 外部請求失敗', {
        status: error.response?.status ?? null,
        code: error.code ?? null,
    });
};

/**
 * 驗證 LINE ID Token
 */
export const verifyLineToken = async (idToken: string): Promise<LineIdTokenVerifyResponse> => {
    if (!idToken || idToken.trim() === '') {
        throw new AuthenticationError('ID token 不能為空');
    }

    const lineChannelId = process.env.LINE_CHANNEL_ID;
    if (!lineChannelId || lineChannelId.trim() === '') {
        throw new ServiceUnavailableError('登入服務尚未完成設定，請聯絡管理員');
    }

    // 快取 key 使用 token 的 hash 而非明文，避免憑證以明文留存於記憶體。
    const cacheKey = `line-token:${createHash('sha256').update(idToken).digest('hex')}`;
    const cached = getCache<LineIdTokenVerifyResponse>(cacheKey);
    if (cached) {
        // 即使 cache entry 尚未淘汰，仍再次確認 exp 與 audience，避免接受過期或錯誤 channel 的 token。
        if (cached.aud === lineChannelId && isTokenUnexpired(cached)) {
            return cached;
        }
        clearCache(cacheKey);
    }

    try {
        const response = await axios.post<LineIdTokenVerifyResponse>(
            'https://api.line.me/oauth2/v2.1/verify',
            new URLSearchParams({ id_token: idToken, client_id: lineChannelId }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: LINE_VERIFY_TIMEOUT_MS,
            }
        );

        if (response.data.aud !== lineChannelId) {
            throw new AuthenticationError('無效的 token - Channel ID 不符');
        }
        if (!response.data.sub || response.data.sub.trim() === '') {
            throw new AuthenticationError('無效的 token - 缺少使用者識別資訊');
        }
        if (!isTokenUnexpired(response.data)) {
            throw new AuthenticationError('Token 已過期或無效');
        }

        // 快取期限取五分鐘與 token 剩餘效期的較小值，並保留安全緩衝，確保不超過 exp。
        const tokenRemainingMs = response.data.exp * 1_000 - Date.now();
        const cacheTtlMs = Math.min(
            LINE_TOKEN_CACHE_MAX_TTL_MS,
            tokenRemainingMs - LINE_TOKEN_CACHE_EXPIRY_SAFETY_MS
        );
        if (cacheTtlMs > 0) {
            setCache(cacheKey, response.data, cacheTtlMs);
        }

        return response.data;
    } catch (error) {
        if (error instanceof AuthenticationError) {
            throw error;
        }

        if (axios.isAxiosError(error)) {
            if (error.response?.status === 400 || error.response?.status === 401) {
                throw new AuthenticationError('Token 已過期或無效');
            }

            logLineVerificationFailure(error);

            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                throw new ServiceUnavailableError('LINE token 驗證逾時，請稍後再試');
            }

            throw new ServiceUnavailableError('LINE token 驗證服務暫時無法使用，請稍後再試');
        }

        throw error;
    }
};

/**
 * 登入或註冊用戶
 */
export const loginOrRegister = async (
    idToken: string,
    phone?: string,
    license?: string
) => {
    // 使用 id_token 取得使用者資訊
    const tokenInfo = await verifyLineToken(idToken);
    const lineId = tokenInfo.sub;
    const displayName = tokenInfo.name || '';
    const pictureUrl = tokenInfo.picture || '';

    // 查詢用戶是否存在
    let user = await userModel.findUserByLineId(lineId);

    if (!user) {
        // 新用戶，需要手機號碼
        if (!phone || phone.trim() === '') {
            throw new NewUserError({ lineId, displayName, pictureUrl });
        }

        // 驗證手機號碼格式
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(phone)) {
            throw new ValidationError('電話號碼格式不正確，應為 09 開頭的 10 位數字');
        }

        // 驗證車牌格式（如果有提供）
        const normalizedLicense = normalizeLicense(license);
        if (normalizedLicense !== '') {
            if (!isValidLicense(normalizedLicense)) {
                throw new ValidationError('車牌格式不正確，須為英數字組合（5-8碼，至少各含1個英文字母與數字），例如：ABC-1234');
            }
        }

        // 建立新用戶
        const userData: CreateUserDTO = {
            lineId,
            name: displayName,
            pictureUrl,
            phone,
            license: normalizeLicense(license),
            role: UserRole.CUSTOMER,
        };

        try {
            user = await userModel.createUser(userData);
        } catch (error: unknown) {
            // P2002: Unique constraint failed
            const duplicateTargets = error instanceof Prisma.PrismaClientKnownRequestError
                && error.code === 'P2002'
                && Array.isArray(error.meta?.target)
                ? error.meta.target
                : [];

            if (duplicateTargets.includes('lineId')) {
                // 如果是因為 lineId 重複導致建立失敗，表示剛剛已經被其他請求建立了
                // 這時候重新查詢一次即可
                user = await userModel.findUserByLineId(lineId);
                if (!user) {
                    // 如果還是找不到，那就真的是未知的錯誤了
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }

    return user;
};

/**
 * 驗證用戶並取得用戶資訊（用於 middleware）
 */
export const authenticateUser = async (idToken: string) => {
    // 取得 LINE id_token 資訊（同時驗證 token）
    const tokenInfo = await verifyLineToken(idToken);
    const lineId = tokenInfo.sub;

    // 查詢用戶
    const user = await userModel.findUserByLineId(lineId);

    if (!user) {
        throw new AuthenticationError('用戶不存在，請先登入');
    }

    return user;
};

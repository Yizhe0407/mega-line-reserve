import axios from 'axios';
import * as userModel from '../model/user';
import { UserRole } from '@prisma/client';
import { CreateUserDTO } from '../types/user';
import { NewUserError, ValidationError, AuthenticationError } from '../types/errors';
import { isValidLicense, normalizeLicense } from '../utils/validators';
import { getCache, setCache } from '../utils/cache';

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

/**
 * 驗證 LINE ID Token
 */
export const verifyLineToken = async (idToken: string): Promise<LineIdTokenVerifyResponse> => {
    if (!idToken || idToken.trim() === '') {
        throw new AuthenticationError('ID token 不能為空');
    }

    // 嘗試從快取取得驗證結果
    const cacheKey = `line-token:${idToken}`;
    const cached = getCache<LineIdTokenVerifyResponse>(cacheKey);
    if (cached) {
        return cached;
    }

    const lineChannelId = process.env.LINE_CHANNEL_ID;
    if (!lineChannelId || lineChannelId.trim() === '') {
        throw new AuthenticationError('LINE_CHANNEL_ID 未設定，無法驗證 ID token');
    }

    try {
        const response = await axios.post<LineIdTokenVerifyResponse>(
            'https://api.line.me/oauth2/v2.1/verify',
            new URLSearchParams({ id_token: idToken, client_id: lineChannelId }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (response.data.aud && response.data.aud !== lineChannelId) {
            throw new AuthenticationError('無效的 token - Channel ID 不符');
        }

        // 寫入快取，保留 5 分鐘
        setCache(cacheKey, response.data, 5 * 60 * 1000);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
            throw new AuthenticationError('Token 已過期或無效');
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
                throw new ValidationError('車牌格式不正確，應為 2-4 個英文字母加 4 位數字（例如：ABC-1234），或舊式 1234-AA');
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
        } catch (error: any) {
            // P2002: Unique constraint failed
            if (error.code === 'P2002' && error.meta?.target?.includes('lineId')) {
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

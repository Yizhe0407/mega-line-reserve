import axios from 'axios';
import * as userModel from '../model/user';
import { UserRole } from '@prisma/client';
import { CreateUserDTO } from '../types/user';
import { NewUserError, ValidationError, AuthenticationError } from '../types/errors';

// LINE Token 驗證回應介面
interface LineTokenVerifyResponse {
    scope: string;
    client_id: string;
    expires_in: number;
}

// LINE Profile 回應介面
interface LineProfileResponse {
    userId: string;
    displayName: string;
    pictureUrl?: string;
}

/**
 * 驗證 LINE Access Token
 */
export const verifyLineToken = async (accessToken: string): Promise<LineTokenVerifyResponse> => {
    if (!accessToken || accessToken.trim() === '') {
        throw new AuthenticationError('Access token 不能為空');
    }

    try {
        const response = await axios.post<LineTokenVerifyResponse>(
            'https://api.line.me/oauth2/v2.1/verify',
            new URLSearchParams({ access_token: accessToken }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        // 檢查 channel ID 是否正確
        const lineChannelId = process.env.LINE_CHANNEL_ID;
        if (lineChannelId && response.data.client_id !== lineChannelId) {
            throw new AuthenticationError('無效的 token - Channel ID 不符');
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
            throw new AuthenticationError('Token 已過期或無效');
        }
        throw error;
    }
};

/**
 * 取得 LINE 用戶 Profile
 */
export const getLineProfile = async (accessToken: string): Promise<LineProfileResponse> => {
    if (!accessToken || accessToken.trim() === '') {
        throw new AuthenticationError('Access token 不能為空');
    }

    try {
        const response = await axios.get<LineProfileResponse>(
            'https://api.line.me/v2/profile',
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            throw new AuthenticationError('Token 無效或已過期');
        }
        throw error;
    }
};

/**
 * 登入或註冊用戶
 */
export const loginOrRegister = async (
    accessToken: string,
    phone?: string,
    license?: string
) => {
    // 驗證 token
    await verifyLineToken(accessToken);

    // 取得 LINE profile
    const profile = await getLineProfile(accessToken);
    const { userId: lineId, displayName, pictureUrl } = profile;

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
        if (license && license.trim() !== '') {
            const licenseRegex = /^[A-Z]{2,4}-?\d{4}$/;
            if (!licenseRegex.test(license)) {
                throw new ValidationError('車牌格式不正確，應為 2-4 個英文字母加 4 位數字（例如：ABC-1234）');
            }
        }

        // 建立新用戶
        const userData: CreateUserDTO = {
            lineId,
            name: displayName,
            pictureUrl: pictureUrl || '',
            phone,
            license: license || '',
            role: UserRole.CUSTOMER,
        };

        user = await userModel.createUser(userData);
    }

    return user;
};

/**
 * 驗證用戶並取得用戶資訊（用於 middleware）
 */
export const authenticateUser = async (accessToken: string) => {
    // 驗證 token
    await verifyLineToken(accessToken);

    // 取得 LINE profile
    const profile = await getLineProfile(accessToken);
    const { userId: lineId } = profile;

    // 查詢用戶
    const user = await userModel.findUserByLineId(lineId);

    if (!user) {
        throw new AuthenticationError('用戶不存在，請先登入');
    }

    return user;
};

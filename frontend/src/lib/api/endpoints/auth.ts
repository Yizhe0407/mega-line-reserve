import { post, get } from '../core/fetch-wrapper';
import { LoginRequest, LoginResponse, MeResponse } from '@/types/auth';

/**
 * 登入或註冊使用者
 */
export const login = (data: LoginRequest, token: string): Promise<LoginResponse> => {
  return post<LoginResponse>('/api/auth/login', data, token);
};

/**
 * 取得當前使用者資訊
 */
export const getMe = (token: string): Promise<MeResponse> => {
  return get<MeResponse>('/api/auth/me', token);
};

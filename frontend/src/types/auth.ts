import { User } from './user';

// 登入請求
export interface LoginRequest {
  phone?: string;
  license?: string;
}

// 登入回應
export interface LoginResponse {
  user: User;
  isNewUser?: boolean;
}

// 取得當前使用者回應
export interface MeResponse {
  user: User;
}

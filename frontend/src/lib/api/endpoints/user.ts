import { get, post, put, del } from '../core/fetch-wrapper';
import { User, CreateUserDTO, UpdateUserDTO } from '@/types/user';

/**
 * 根據 Line ID 取得使用者
 */
export const getUserByLineId = (lineId: string, token: string): Promise<User> => {
  return get<User>(`/api/users/line/${lineId}`, token);
};

/**
 * 根據 ID 取得使用者
 */
export const getUserById = (id: number, token: string): Promise<User> => {
  return get<User>(`/api/users/${id}`, token);
};

/**
 * 建立使用者 (僅 ADMIN)
 */
export const createUser = (data: CreateUserDTO, token: string): Promise<User> => {
  return post<User>('/api/users', data, token);
};

/**
 * 更新使用者 (使用者只能更新自己)
 */
export const updateUser = (
  id: number,
  data: UpdateUserDTO,
  token: string
): Promise<User> => {
  return put<User>(`/api/users/${id}`, data, token);
};

/**
 * 刪除使用者 (僅 ADMIN)
 */
export const deleteUser = (id: number, token: string): Promise<User> => {
  return del<User>(`/api/users/${id}`, token);
};

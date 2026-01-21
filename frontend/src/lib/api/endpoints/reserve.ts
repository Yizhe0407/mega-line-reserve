import { get, post, put, del } from '../core/fetch-wrapper';
import { Reserve, CreateReserveDTO, UpdateReserveDTO } from '@/types/reserve';

/**
 * 取得預約列表
 */
export const getReserves = (token: string): Promise<Reserve[]> => {
  return get<Reserve[]>('/api/reserves', token);
};

/**
 * 根據 ID 取得單一預約
 */
export const getReserveById = (id: number, token: string): Promise<Reserve> => {
  return get<Reserve>(`/api/reserves/${id}`, token);
};

/**
 * 建立預約
 */
export const createReserve = (data: CreateReserveDTO, token: string): Promise<Reserve> => {
  return post<Reserve>('/api/reserves', data, token);
};

/**
 * 更新預約
 */
export const updateReserve = (id: number, data: UpdateReserveDTO, token: string): Promise<Reserve> => {
  return put<Reserve>(`/api/reserves/${id}`, data, token);
};

/**
 * 刪除預約
 */
export const deleteReserve = (id: number, token: string): Promise<{ message: string }> => {
  return del<{ message: string }>(`/api/reserves/${id}`, token);
};

import { get, post, put, del } from '../core/fetch-wrapper';
import { Service, CreateServiceDTO, UpdateServiceDTO } from '@/types/service';

/**
 * 取得所有服務列表
 */
export const getAllServices = (): Promise<Service[]> => {
  return get<Service[]>('/api/services');
};

/**
 * 根據 ID 取得單一服務
 */
export const getServiceById = (id: number): Promise<Service> => {
  return get<Service>(`/api/services/${id}`);
};

/**
 * 建立服務 (僅限管理員)
 */
export const createService = (data: CreateServiceDTO, token: string): Promise<Service> => {
  return post<Service>('/api/services', data, token);
};

/**
 * 更新服務 (僅限管理員)
 */
export const updateService = (id: number, data: UpdateServiceDTO, token: string): Promise<Service> => {
  return put<Service>(`/api/services/${id}`, data, token);
};

/**
 * 刪除服務 (僅限管理員)
 */
export const deleteService = (id: number, token: string): Promise<{ message: string }> => {
  return del<{ message: string }>(`/api/services/${id}`, token);
};

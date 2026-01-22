import { get, post, put, del } from '../core/fetch-wrapper';
import { TimeSlot } from '@/types/timeSlot';

export interface CreateTimeSlotDTO {
  dayOfWeek: number;
  startTime: string;
  capacity?: number;
  isActive?: boolean;
}

export interface UpdateTimeSlotDTO {
  dayOfWeek?: number;
  startTime?: string;
  capacity?: number;
  isActive?: boolean;
}

/**
 * 取得所有時段 (ADMIN)
 */
export const getAllTimeSlots = (token: string): Promise<TimeSlot[]> => {
  return get<TimeSlot[]>('/api/time-slot', token);
};

/**
 * 取得可用時段 (公開)
 */
export const getActiveTimeSlots = (): Promise<TimeSlot[]> => {
  return get<TimeSlot[]>('/api/time-slot/active');
};

/**
 * 建立時段 (ADMIN)
 */
export const createTimeSlot = (data: CreateTimeSlotDTO, token: string): Promise<TimeSlot> => {
  return post<TimeSlot>('/api/time-slot', data, token);
};

/**
 * 更新時段 (ADMIN)
 */
export const updateTimeSlot = (id: number, data: UpdateTimeSlotDTO, token: string): Promise<TimeSlot> => {
  return put<TimeSlot>(`/api/time-slot/${id}`, data, token);
};

/**
 * 刪除時段 (ADMIN)
 */
export const deleteTimeSlot = (id: number, token: string): Promise<{ message: string }> => {
  return del<{ message: string }>(`/api/time-slot/${id}`, token);
};

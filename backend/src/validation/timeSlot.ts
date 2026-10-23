import { z } from 'zod';

const timeSlotFields = {
    dayOfWeek: z.number().int('星期必須是整數').min(0, '星期必須介於 0 到 6').max(6, '星期必須介於 0 到 6'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '時間格式必須是 HH:mm'),
    capacity: z.number().int('容量必須是整數').min(1, '容量必須大於 0').max(1000, '容量不可超過 1000').optional(),
    isActive: z.boolean().optional(),
};

export const createTimeSlotBodySchema = z.object(timeSlotFields).strict();

export const updateTimeSlotBodySchema = z.object(timeSlotFields)
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, '至少需要提供一個更新欄位');

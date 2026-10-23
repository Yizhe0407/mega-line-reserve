import { z } from 'zod';

const serviceFields = {
    name: z.string().trim().min(1, '服務名稱不能為空').max(100, '服務名稱不可超過 100 字'),
    description: z.string().trim().max(191, '服務描述不可超過 191 字').optional(),
    price: z.number().finite('價格必須是有限數值').min(0, '價格不能為負數').max(99_999_999.99, '價格超過允許範圍').optional(),
    duration: z.number().int('服務時長必須是整數').min(1, '服務時長必須大於 0').max(1440, '服務時長不可超過 1440 分鐘').optional(),
    isActive: z.boolean().optional(),
};

export const createServiceBodySchema = z.object(serviceFields).strict();

export const updateServiceBodySchema = z.object(serviceFields)
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, '至少需要提供一個更新欄位');

import { ReserveStatus } from '@prisma/client';
import { z } from 'zod';
import { CreateReserveDTO, UpdateReserveDTO } from '../types/reserve';
import { parseDateOnly } from '../utils/dateOnly';
import { RESERVE_INPUT_LIMITS } from '../utils/reservationRules';

const positiveIdSchema = z.number()
    .int('ID 必須是整數')
    .positive('ID 必須大於 0');

const dateOnlySchema = z.string()
    .refine((value) => parseDateOnly(value) !== null, '預約日期格式必須為 YYYY-MM-DD 且為有效日期');

const licenseSchema = z.string()
    .trim()
    .min(1, '請提供車牌號碼')
    .max(RESERVE_INPUT_LIMITS.license, `車牌長度不可超過 ${RESERVE_INPUT_LIMITS.license} 字`);

const memoSchema = z.string()
    .trim()
    .max(RESERVE_INPUT_LIMITS.memo, `備註不可超過 ${RESERVE_INPUT_LIMITS.memo} 字`);

const serviceIdsSchema = z.array(positiveIdSchema)
    .min(1, '請至少選擇一個服務')
    .max(RESERVE_INPUT_LIMITS.serviceIds, `服務項目不可超過 ${RESERVE_INPUT_LIMITS.serviceIds} 個`);

export const createReserveBodySchema = z.object({
    timeSlotId: positiveIdSchema,
    license: licenseSchema,
    serviceIds: serviceIdsSchema,
    userMemo: memoSchema.optional(),
    date: dateOnlySchema,
    isPickup: z.boolean(),
}).strict() satisfies z.ZodType<CreateReserveDTO>;

export const updateReserveBodySchema = z.object({
    status: z.enum(ReserveStatus).optional(),
    adminMemo: memoSchema.optional(),
    timeSlotId: positiveIdSchema.optional(),
    license: licenseSchema.optional(),
    date: dateOnlySchema.optional(),
    serviceIds: serviceIdsSchema.optional(),
    userMemo: memoSchema.optional(),
    isPickup: z.boolean().optional(),
}).strict()
    .refine((data) => Object.keys(data).length > 0, '至少需要提供一個更新欄位') satisfies z.ZodType<UpdateReserveDTO>;

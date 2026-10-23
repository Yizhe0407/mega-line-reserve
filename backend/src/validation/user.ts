import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { CreateUserDTO, UpdateUserDTO } from '../types/user';

const isHttpUrl = (value: string): boolean => {
    if (value === '') return true;

    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
};

const lineIdSchema = z.string()
    .trim()
    .min(1, 'Line ID 不能為空')
    .max(128, 'Line ID 不可超過 128 字');

const nameSchema = z.string()
    .trim()
    .min(1, '使用者名稱不能為空')
    .max(100, '使用者名稱不可超過 100 字');

const pictureUrlSchema = z.string()
    .trim()
    .max(2048, '圖片網址不可超過 2048 字')
    .refine(isHttpUrl, '圖片網址必須是有效的 HTTP 或 HTTPS URL')
    .transform((value) => value === '' ? null : value)
    .nullable();

const phoneSchema = z.string()
    .trim()
    .regex(/^09\d{8}$/, '電話號碼格式不正確，應為 09 開頭的 10 位數字');

const licenseSchema = z.string()
    .trim()
    .max(12, '車牌長度不可超過 12 碼')
    .transform((value) => value === '' ? null : value)
    .nullable();

export const createUserBodySchema = z.object({
    lineId: lineIdSchema,
    name: nameSchema,
    pictureUrl: pictureUrlSchema.optional(),
    phone: phoneSchema,
    license: licenseSchema.optional(),
    role: z.enum(UserRole),
}).strict() satisfies z.ZodType<CreateUserDTO>;

export const updateUserBodySchema = z.object({
    name: nameSchema.optional(),
    pictureUrl: pictureUrlSchema.optional(),
    phone: phoneSchema.optional(),
    license: licenseSchema.optional(),
}).strict()
    .refine((data) => Object.keys(data).length > 0, '至少需要提供一個更新欄位') satisfies z.ZodType<UpdateUserDTO>;

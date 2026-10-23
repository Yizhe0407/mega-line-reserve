import { z } from 'zod';

export const loginBodySchema = z.object({
    phone: z.string()
        .trim()
        .max(10, '電話號碼長度不可超過 10 碼')
        .refine((value) => value === '' || /^09\d{8}$/.test(value), '電話號碼格式不正確')
        .optional(),
    license: z.string()
        .trim()
        .max(12, '車牌長度不可超過 12 碼')
        .optional(),
}).strict();

import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ValidationError } from '../types/errors';

const formatIssuePath = (path: PropertyKey[]): string => {
    const normalized = path.map(String).filter(Boolean).join('.');
    return normalized ? `${normalized}: ` : '';
};

/**
 * 驗證並正規化 JSON body，strict schema 可防止未授權欄位被傳入資料層。
 */
export const validateBody = <T>(schema: z.ZodType<T>) => (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const issue = result.error.issues[0];
        const message = issue.code === 'unrecognized_keys'
            ? '包含不允許的欄位'
            : `${formatIssuePath(issue.path)}${issue.message}`;
        next(new ValidationError(message));
        return;
    }

    req.body = result.data;
    next();
};

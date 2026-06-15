import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, AuthenticationError, NewUserError } from '../types/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof NewUserError) {
    return res.status(400).json({
      error: err.message,
      isNewUser: true,
      lineProfile: err.lineProfile
    });
  }

  // P2002: Unique constraint failed（例如手機號碼已被其他帳號註冊）
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = (err.meta?.target as string[] | undefined) ?? [];
    if (target.includes('phone')) {
      return res.status(409).json({ error: '此手機號碼已被其他帳號註冊，請確認後再試' });
    }
    return res.status(409).json({ error: '資料重複，請確認後再試' });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({ error: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  // 預設 500 錯誤
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? '伺服器內部錯誤' : err.message
  });
};

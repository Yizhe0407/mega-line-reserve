import { Request, Response, NextFunction } from 'express';
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

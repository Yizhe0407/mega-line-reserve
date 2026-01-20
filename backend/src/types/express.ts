import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserProfile } from './user';

export type ControllerHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void> | void;

// 擴展的 Request，包含 user 和 accessToken 屬性
export interface AuthRequest extends Request {
    user?: UserProfile;
    accessToken?: string;
}
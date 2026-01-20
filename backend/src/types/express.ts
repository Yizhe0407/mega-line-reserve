import { Request, Response, NextFunction, RequestHandler } from 'express';

export type ControllerHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void> | void;
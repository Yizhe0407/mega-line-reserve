import { Response, NextFunction } from 'express';
import * as userService from '../services/user';
import { AuthRequest } from '../types/express';
import { UserResponseDTO } from '../types/user';

export const getUserByLineId = (
    req: AuthRequest,
    res: Response<UserResponseDTO | null>,
    next: NextFunction
): void => {
    userService.getUserByLineId(req.params.lineId)
        .then((user) => res.json(user))
        .catch(next);
};

export const getUserById = (
    req: AuthRequest,
    res: Response<UserResponseDTO>,
    next: NextFunction
): void => {
    userService.getUserById(req.params.id)
        .then((user) => res.json(user))
        .catch(next);
};

export const createUser = (
    req: AuthRequest,
    res: Response<UserResponseDTO>,
    next: NextFunction
): void => {
    userService.createUser(req.body)
        .then((user) => res.status(201).json(user))
        .catch(next);
};

export const updateUser = (
    req: AuthRequest,
    res: Response<UserResponseDTO>,
    next: NextFunction
): void => {
    userService.updateUser(req.params.id, req.body, req.user!.id)
        .then((user) => res.json(user))
        .catch(next);
};

export const deleteUser = (
    req: AuthRequest,
    res: Response<UserResponseDTO>,
    next: NextFunction
): void => {
    userService.deleteUser(req.params.id)
        .then((user) => res.json(user))
        .catch(next);
};

import { Response, NextFunction } from 'express';
import * as userService from "../services/user";
import { AuthRequest } from "../types/express";

export const getUserByLineId = (req: AuthRequest, res: Response, next: NextFunction) => {
    userService.getUserByLineId(req.params.lineId)
        .then((user) => res.json(user))
        .catch(next);
};

export const getUserById = (req: AuthRequest, res: Response, next: NextFunction) => {
    userService.getUserById(req.params.id)
        .then((user) => res.json(user))
        .catch(next);
};

export const createUser = (req: AuthRequest, res: Response, next: NextFunction) => {
    userService.createUser(req.body)
        .then((user) => res.status(201).json(user))
        .catch(next);
};

export const updateUser = (req: AuthRequest, res: Response, next: NextFunction) => {
    userService.updateUser(req.params.id, req.body, req.user!.id)
        .then((user) => res.json(user))
        .catch(next);
};

export const deleteUser = (req: AuthRequest, res: Response, next: NextFunction) => {
    userService.deleteUser(req.params.id)
        .then((user) => res.json(user))
        .catch(next);
};
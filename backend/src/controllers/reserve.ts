import { Response, NextFunction } from 'express';
import * as reserveService from "../services/reserve";
import { AuthRequest } from "../types/express";

// 取得預約列表
export const getReserves = (req: AuthRequest, res: Response, next: NextFunction) => {
    reserveService.getReserves(req.user!)
        .then((reserves) => res.json(reserves))
        .catch(next);
};

// 取得單一預約
export const getReserveById = (req: AuthRequest, res: Response, next: NextFunction) => {
    reserveService.getReserveById(req.params.id, req.user!.id, req.user!.role)
        .then((reserve) => res.json(reserve))
        .catch(next);
};

// 建立預約
export const createReserve = (req: AuthRequest, res: Response, next: NextFunction) => {
    reserveService.createReserve(req.user!.id, req.body)
        .then((reserve) => res.status(201).json(reserve))
        .catch(next);
};

// 更新預約
export const updateReserve = (req: AuthRequest, res: Response, next: NextFunction) => {
    reserveService.updateReserve(req.params.id, req.body, req.user!.id, req.user!.role)
        .then((reserve) => res.json(reserve))
        .catch(next);
};

// 刪除預約
export const deleteReserve = (req: AuthRequest, res: Response, next: NextFunction) => {
    reserveService.deleteReserve(req.params.id, req.user!.id, req.user!.role)
        .then(() => res.json({ message: "Reserve deleted successfully" }))
        .catch(next);
};

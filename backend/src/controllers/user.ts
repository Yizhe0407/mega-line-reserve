import { Response } from 'express';
import * as userService from "../services/user";
import { AuthRequest } from "../types/express";
import { ValidationError, NotFoundError } from "../types/errors";

export const getUserByLineId = async (req: AuthRequest, res: Response): Promise<void> => {
    const lineId = req.params.lineId as string;
    try {
        const user = await userService.getUserByLineId(lineId);
        res.json(user);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error('Get user by lineId error:', error);
        res.status(500).json({ error: "無法取得使用者" });
    }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(Number(id));
        res.json(user);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Get user by id error:', error);
        res.status(500).json({ error: "無法取得使用者" });
    }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: "無法建立使用者" });
    }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        // 傳遞當前使用者 ID 進行權限檢查
        const user = await userService.updateUser(Number(id), req.body, req.user!.id);
        res.json(user);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Update user error:', error);
        res.status(500).json({ error: "無法更新使用者" });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const user = await userService.deleteUser(Number(id));
        res.json(user);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
            return;
        }
        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
            return;
        }
        console.error('Delete user error:', error);
        res.status(500).json({ error: "無法刪除使用者" });
    }
};
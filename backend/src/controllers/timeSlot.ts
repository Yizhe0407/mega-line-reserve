import { Response, NextFunction } from "express";
import * as timeSlotService from "../services/timeSlot";
import { AuthRequest } from "../types/express";

export const getAllTimeSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const timeSlots = await timeSlotService.getAllTimeSlots();
        res.json(timeSlots);
    } catch (error) {
        next(error);
    }
};

export const getActiveTimeSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const timeSlots = await timeSlotService.getActiveTimeSlots();
        res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=30");
        res.json(timeSlots);
    } catch (error) {
        next(error);
    }
};

export const getAvailableTimeSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const dateStr = req.query.date as string;
        const timeSlots = await timeSlotService.getAvailableTimeSlots(dateStr);
        // 不快取，因為這是特定日期且變動快
        res.set("Cache-Control", "no-store");
        res.json(timeSlots);
    } catch (error) {
        next(error);
    }
};

export const getTimeSlotById = (req: AuthRequest, res: Response, next: NextFunction) => {
    timeSlotService.getTimeSlotById(req.params.id)
        .then((timeSlot) => res.json(timeSlot))
        .catch(next);
};

export const createTimeSlot = (req: AuthRequest, res: Response, next: NextFunction) => {
    timeSlotService.createTimeSlot(req.body)
        .then((timeSlot) => res.status(201).json(timeSlot))
        .catch(next);
};

export const updateTimeSlot = (req: AuthRequest, res: Response, next: NextFunction) => {
    timeSlotService.updateTimeSlot(req.params.id, req.body)
        .then((timeSlot) => res.json(timeSlot))
        .catch(next);
};

export const deleteTimeSlot = (req: AuthRequest, res: Response, next: NextFunction) => {
    timeSlotService.deleteTimeSlot(req.params.id)
        .then(() => res.json({ message: "TimeSlot deleted successfully" }))
        .catch(next);
};

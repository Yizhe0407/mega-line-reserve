import * as timeSlotModel from "../model/timeSlot";
import { CreateTimeSlotDTO, UpdateTimeSlotDTO } from "../types/timeSlot";
import { NotFoundError, ValidationError } from "../types/errors";

// 驗證時間格式 HH:mm
const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

// 驗證星期幾 (0-6)
const validateDayOfWeek = (day: number): boolean => {
    return Number.isInteger(day) && day >= 0 && day <= 6;
};

export const getAllTimeSlots = () => {
    return timeSlotModel.getAllTimeSlots();
};

export const getActiveTimeSlots = () => {
    return timeSlotModel.getActiveTimeSlots();
};

export const getTimeSlotById = async (idParam: string | string[]) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的時段 ID");
    }

    const timeSlot = await timeSlotModel.getTimeSlotById(id);
    if (!timeSlot) {
        throw new NotFoundError("時段不存在");
    }
    return timeSlot;
};

export const createTimeSlot = async (data: CreateTimeSlotDTO) => {
    if (data.dayOfWeek === undefined) {
        throw new ValidationError("請提供星期幾");
    }

    if (!validateDayOfWeek(data.dayOfWeek)) {
        throw new ValidationError("星期幾必須是 0-6 之間的整數 (0=週日, 6=週六)");
    }

    if (!data.startTime) {
        throw new ValidationError("請提供時段時間");
    }

    if (!validateTimeFormat(data.startTime)) {
        throw new ValidationError("時間格式錯誤，請使用 HH:mm 格式 (例如 08:00, 13:30)");
    }

    if (data.capacity !== undefined && data.capacity <= 0) {
        throw new ValidationError("容量必須大於 0");
    }

    return timeSlotModel.createTimeSlot({
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        capacity: data.capacity ?? 1,
        isActive: data.isActive ?? true
    });
};

export const updateTimeSlot = async (idParam: string | string[], data: UpdateTimeSlotDTO) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的時段 ID");
    }

    const existing = await timeSlotModel.getTimeSlotById(id);
    if (!existing) {
        throw new NotFoundError("時段不存在");
    }

    if (data.dayOfWeek !== undefined && !validateDayOfWeek(data.dayOfWeek)) {
        throw new ValidationError("星期幾必須是 0-6 之間的整數 (0=週日, 6=週六)");
    }

    if (data.startTime !== undefined && !validateTimeFormat(data.startTime)) {
        throw new ValidationError("時間格式錯誤，請使用 HH:mm 格式 (例如 08:00, 13:30)");
    }

    if (data.capacity !== undefined && data.capacity <= 0) {
        throw new ValidationError("容量必須大於 0");
    }

    return timeSlotModel.updateTimeSlot(id, data);
};

export const deleteTimeSlot = async (idParam: string | string[]) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的時段 ID");
    }

    const existing = await timeSlotModel.getTimeSlotById(id);
    if (!existing) {
        throw new NotFoundError("時段不存在");
    }

    return timeSlotModel.deleteTimeSlot(id);
};


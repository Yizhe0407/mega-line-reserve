import * as timeSlotModel from "../model/timeSlot";
import { CreateTimeSlotDTO, UpdateTimeSlotDTO, TimeSlot } from "../types/timeSlot";
import { NotFoundError, ValidationError } from "../types/errors";
import { clearCache, getCache, setCache } from "../utils/cache";

const TIME_SLOTS_ALL_CACHE_KEY = "time-slots:all";
const TIME_SLOTS_ACTIVE_CACHE_KEY = "time-slots:active";

// 驗證時間格式 HH:mm
const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

// 驗證星期幾 (0-6)
const validateDayOfWeek = (day: number): boolean => {
    return Number.isInteger(day) && day >= 0 && day <= 6;
};

export const getAllTimeSlots = async () => {
    const cached = getCache<TimeSlot[]>(TIME_SLOTS_ALL_CACHE_KEY);
    if (cached) return cached;
    const slots = await timeSlotModel.getAllTimeSlots();
    setCache(TIME_SLOTS_ALL_CACHE_KEY, slots);
    return slots;
};

export const getActiveTimeSlots = async () => {
    const cached = getCache<TimeSlot[]>(TIME_SLOTS_ACTIVE_CACHE_KEY);
    if (cached) return cached;
    const slots = await timeSlotModel.getActiveTimeSlots();
    setCache(TIME_SLOTS_ACTIVE_CACHE_KEY, slots);
    return slots;
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

    // 檢查是否已存在相同的時段
    const existing = await timeSlotModel.getTimeSlotByDayAndTime(data.dayOfWeek, data.startTime);
    if (existing) {
        throw new ValidationError(`此時段已存在 (${["週日", "週一", "週二", "週三", "週四", "週五", "週六"][data.dayOfWeek]} ${data.startTime})`);
    }

    const created = await timeSlotModel.createTimeSlot({
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        capacity: data.capacity ?? 1,
        isActive: data.isActive ?? true
    });
    clearCache("time-slots:");
    return created;
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

    // 如果更新了 dayOfWeek 或 startTime，檢查是否與其他時段重複
    if (data.dayOfWeek !== undefined || data.startTime !== undefined) {
        const newDayOfWeek = data.dayOfWeek ?? existing.dayOfWeek;
        const newStartTime = data.startTime ?? existing.startTime;
        
        const duplicate = await timeSlotModel.getTimeSlotByDayAndTime(newDayOfWeek, newStartTime);
        if (duplicate && duplicate.id !== id) {
            throw new ValidationError(`此時段已存在 (${["週日", "週一", "週二", "週三", "週四", "週五", "週六"][newDayOfWeek]} ${newStartTime})`);
        }
    }

    const updated = await timeSlotModel.updateTimeSlot(id, data);
    clearCache("time-slots:");
    return updated;
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

    const deleted = await timeSlotModel.deleteTimeSlot(id);
    clearCache("time-slots:");
    return deleted;
};


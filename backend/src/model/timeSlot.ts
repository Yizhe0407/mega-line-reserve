import { prisma } from "../config/database";
import { CreateTimeSlotDTO, UpdateTimeSlotDTO } from "../types/timeSlot";

export const getAllTimeSlots = () => {
    return prisma.timeSlot.findMany({
        orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" }
        ]
    });
};

export const getActiveTimeSlots = () => {
    return prisma.timeSlot.findMany({
        where: {
            isActive: true
        },
        // 移除 misleading 的全域計數，改為由 getAvailableTimeSlotsByDate 處理特定日期的計數
        orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" }
        ]
    });
};

export const getTimeSlotsWithReserveCount = (dayOfWeek: number, date: Date) => {
    return prisma.timeSlot.findMany({
        where: {
            isActive: true,
            dayOfWeek: dayOfWeek
        },
        include: {
            _count: {
                select: {
                    reserves: {
                        where: {
                            status: { not: 'CANCELLED' },
                            date: date
                        }
                    }
                }
            }
        },
        orderBy: { startTime: 'asc' }
    });
};

export const getTimeSlotById = (id: number) => {
    return prisma.timeSlot.findUnique({
        where: { id }
    });
};

export const getTimeSlotByDayAndTime = (dayOfWeek: number, startTime: string) => {
    return prisma.timeSlot.findFirst({
        where: {
            dayOfWeek,
            startTime
        }
    });
};

export const createTimeSlot = (data: { dayOfWeek: number; startTime: string; capacity: number; isActive: boolean }) => {
    return prisma.timeSlot.create({
        data
    });
};

export const updateTimeSlot = (id: number, data: UpdateTimeSlotDTO) => {
    return prisma.timeSlot.update({
        where: { id },
        data
    });
};

export const deleteTimeSlot = (id: number) => {
    return prisma.timeSlot.delete({
        where: { id }
    });
};

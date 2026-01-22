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
        include: {
            _count: {
                select: {
                    reserves: {
                        where: {
                            status: {
                                not: 'CANCELLED'
                            }
                        }
                    }
                }
            }
        },
        orderBy: [
            { dayOfWeek: "asc" },
            { startTime: "asc" }
        ]
    });
};

export const getTimeSlotById = (id: number) => {
    return prisma.timeSlot.findUnique({
        where: { id }
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


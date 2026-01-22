import { ReserveStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { CreateReserveDTO, UpdateReserveDTO } from "../types/reserve";

// 取得所有預約 (管理端)
export const getAllReserves = () => {
    return prisma.reserve.findMany({
        include: {
            user: true,
            timeSlot: true,
            services: {
                include: {
                    service: true
                }
            }
        },
        orderBy: [
            {
                timeSlot: {
                    dayOfWeek: 'asc'
                }
            },
            {
                timeSlot: {
                    startTime: 'asc'
                }
            }
        ]
    });
};

// 取得使用者的預約
export const getReservesByUserId = (userId: number) => {
    return prisma.reserve.findMany({
        where: { userId },
        include: {
            timeSlot: true,
            services: {
                include: {
                    service: true
                }
            }
        },
        orderBy: [
            {
                timeSlot: {
                    dayOfWeek: 'asc'
                }
            },
            {
                timeSlot: {
                    startTime: 'asc'
                }
            }
        ]
    });
};

// 取得單一代辦
export const getReserveById = (id: number) => {
    return prisma.reserve.findUnique({
        where: { id },
        include: {
            user: true,
            timeSlot: true,
            services: {
                include: {
                    service: true
                }
            }
        }
    });
};

// 建立預約
export const createReserve = (userId: number, data: CreateReserveDTO) => {
    const { timeSlotId, license, serviceIds, userMemo } = data;
    
    return prisma.reserve.create({
        data: {
            userId,
            timeSlotId,
            license,
            userMemo,
            services: {
                create: serviceIds.map(serviceId => ({
                    service: {
                        connect: { id: serviceId }
                    }
                }))
            }
        },
        include: {
            timeSlot: true,
            services: {
                include: {
                    service: true
                }
            }
        }
    });
};

// 更新預約 (狀態或管理端備註)
export const updateReserve = (id: number, data: UpdateReserveDTO) => {
    const { status, adminMemo, license, timeSlotId } = data;
    
    return prisma.reserve.update({
        where: { id },
        data: {
            status,
            adminMemo,
            timeSlotId,
            license
        }
    });
};

// 刪除預約
export const deleteReserve = (id: number) => {
    return prisma.reserve.delete({
        where: { id }
    });
};

export const countActiveReservesByTimeSlot = (timeSlotId: number) => {
    return prisma.reserve.count({
        where: {
            timeSlotId,
            status: {
                not: ReserveStatus.CANCELLED
            }
        }
    });
};

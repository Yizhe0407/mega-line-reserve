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
    const { timeSlotId, license, serviceIds, userMemo, date } = data;
    
    return prisma.reserve.create({
        data: {
            userId,
            timeSlotId,
            date: new Date(date),
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
    const { status, adminMemo, license, timeSlotId, date, userMemo, serviceIds } = data;
    
    // 準備更新資料物件
    const updateData: any = {
        status,
        adminMemo,
        timeSlotId,
        license,
        userMemo
    };

    if (date) {
        updateData.date = new Date(date);
    }

    // 如果有傳入 serviceIds，則先刪除舊關聯再建立新關聯
    if (serviceIds) {
        updateData.services = {
            deleteMany: {}, // 刪除舊的所有服務
            create: serviceIds.map(serviceId => ({
                service: {
                    connect: { id: serviceId }
                }
            }))
        };
    }

    return prisma.reserve.update({
        where: { id },
        data: updateData, // 使用動態構建的 data 物件
        include: { // 確保回傳資料包含關聯
            services: {
                include: {
                    service: true
                }
            },
            timeSlot: true
        }
    });
};

// 刪除預約
export const deleteReserve = (id: number) => {
    return prisma.reserve.delete({
        where: { id }
    });
};

export const countActiveReservesByTimeSlotAndDate = (timeSlotId: number, date: string) => {
    const targetDate = new Date(date);
    return prisma.reserve.count({
        where: {
            timeSlotId,
            date: targetDate,
            status: {
                not: ReserveStatus.CANCELLED
            }
        }
    });
};

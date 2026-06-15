import { Prisma, ReserveStatus } from "@prisma/client";
import { prisma } from "../config/database";
import { CreateReserveDTO, UpdateReserveDTO } from "../types/reserve";

// 可傳入 prisma 或 transaction client，讓呼叫端可在交易中執行以避免競態
type DbClient = Prisma.TransactionClient;

// 取得所有預約 (管理端，分頁避免資料量成長後 unbounded 查詢)
export const getAllReserves = ({ skip, take }: { skip?: number; take?: number } = {}) => {
    return prisma.reserve.findMany({
        skip,
        take,
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
                date: 'asc'
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
                date: 'asc'
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
export const createReserve = (userId: number, data: CreateReserveDTO, db: DbClient = prisma) => {
    const { timeSlotId, license, serviceIds, userMemo, date, isPickup } = data;

    return db.reserve.create({
        data: {
            userId,
            timeSlotId,
            date: new Date(date),
            license,
            isPickup: isPickup || false,
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
export const updateReserve = (id: number, data: UpdateReserveDTO, db: DbClient = prisma) => {
    const { status, adminMemo, license, timeSlotId, date, userMemo, serviceIds, isPickup } = data;

    // 準備更新資料物件
    const updateData: Prisma.ReserveUpdateInput = {
        status,
        adminMemo,
        license,
        userMemo,
        ...(timeSlotId !== undefined && {
            timeSlot: { connect: { id: timeSlotId } }
        })
    };

    if (date) {
        updateData.date = new Date(date);
    }

    if (isPickup !== undefined) {
        updateData.isPickup = isPickup;
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

    return db.reserve.update({
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

export const countActiveReservesByTimeSlotAndDate = (timeSlotId: number, date: string, db: DbClient = prisma) => {
    const targetDate = new Date(date);
    return db.reserve.count({
        where: {
            timeSlotId,
            date: targetDate,
            status: {
                not: ReserveStatus.CANCELLED
            }
        }
    });
};

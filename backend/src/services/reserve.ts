import * as reserveModel from "../model/reserve";
import * as timeSlotModel from "../model/timeSlot";
import { CreateReserveDTO, UpdateReserveDTO } from "../types/reserve";
import { ValidationError, NotFoundError } from "../types/errors";
import { UserRole } from "@prisma/client";

// 取得預約列表 (根據權限範圍)
export const getReserves = async (user: { id: number, role: UserRole }) => {
    if (user.role === UserRole.ADMIN) {
        return reserveModel.getAllReserves();
    }
    return reserveModel.getReservesByUserId(user.id);
};

// 取得單一預約
export const getReserveById = async (idParam: string | string[], currentUserId: number, role: UserRole) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的預約 ID");
    }

    const reserve = await reserveModel.getReserveById(id);
    if (!reserve) {
        throw new NotFoundError("找不到此預約");
    }

    // 權限檢查：Customer 只能看自己的預約
    if (role === UserRole.CUSTOMER && reserve.userId !== currentUserId) {
        throw new ValidationError("您無權查看此預約");
    }

    return reserve;
};

// 建立預約
export const createReserve = async (userId: number, data: CreateReserveDTO) => {
    // 1. 驗證資料
    if (!data.timeSlotId) {
        throw new ValidationError("請選擇預約時段");
    }

    const timeSlot = await timeSlotModel.getTimeSlotById(data.timeSlotId);
    if (!timeSlot || !timeSlot.isActive) {
        throw new ValidationError("預約時段不存在或已停用");
    }

    const reserveCount = await reserveModel.countActiveReservesByTimeSlot(data.timeSlotId);
    const capacity = timeSlot.capacity ?? 1;
    if (reserveCount >= capacity) {
        throw new ValidationError("此時段已額滿");
    }

    if (!data.license || data.license.trim() === "") {
        throw new ValidationError("請提供車牌號碼");
    }

    if (!data.serviceIds || data.serviceIds.length === 0) {
        throw new ValidationError("請至少選擇一個服務");
    }

    // 2. 建立預約
    return reserveModel.createReserve(userId, data);
};

// 更新預約 (管理員變更狀態或備註)
export const updateReserve = async (
    idParam: string | string[], 
    data: UpdateReserveDTO, 
    currentUserId: number, 
    role: UserRole
) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的預約 ID");
    }

    const existingReserve = await reserveModel.getReserveById(id);
    if (!existingReserve) {
        throw new NotFoundError("找不到此預約");
    }

    // 權限檢查：Customer 只能取消自己的預約 (未實作，目前統一由 update 處理，但可加入邏輯)
    if (role === UserRole.CUSTOMER && existingReserve.userId !== currentUserId) {
        throw new ValidationError("您無權修改此預約");
    }

    if (data.timeSlotId) {
        const timeSlot = await timeSlotModel.getTimeSlotById(data.timeSlotId);
        if (!timeSlot || !timeSlot.isActive) {
            throw new ValidationError("預約時段不存在或已停用");
        }

        if (data.timeSlotId !== existingReserve.timeSlotId) {
            const reserveCount = await reserveModel.countActiveReservesByTimeSlot(data.timeSlotId);
            const capacity = timeSlot.capacity ?? 1;
            if (reserveCount >= capacity) {
                throw new ValidationError("此時段已額滿");
            }
        }

    }

    return reserveModel.updateReserve(id, data);
};

// 刪除預約
export const deleteReserve = async (idParam: string | string[], currentUserId: number, role: UserRole) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    if (isNaN(id)) {
        throw new ValidationError("無效的預約 ID");
    }

    const existingReserve = await reserveModel.getReserveById(id);
    if (!existingReserve) {
        throw new NotFoundError("找不到此預約");
    }

    if (role === UserRole.CUSTOMER && existingReserve.userId !== currentUserId) {
        throw new ValidationError("您無權刪除此預約");
    }

    return reserveModel.deleteReserve(id);
};

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

    if (!data.date || isNaN(Date.parse(data.date))) {
        throw new ValidationError("無效的預約日期");
    }

    const reserveCount = await reserveModel.countActiveReservesByTimeSlotAndDate(data.timeSlotId, data.date);
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

    // 權限檢查：Customer 只能取消自己的預約 或 修改未來的預約 -- 但這由 Controller 層級控制身分驗證，這裡只檢查 ID 匹配
    // 這裡我們允許 Customer 修改自己的預約 details
    if (role === UserRole.CUSTOMER && existingReserve.userId !== currentUserId) {
        throw new ValidationError("您無權修改此預約");
    }

    // 檢查日期或時段是否變更
    const isTimeChanged = data.timeSlotId || data.date;
    
    if (isTimeChanged) {
        const newTimeSlotId = data.timeSlotId ?? existingReserve.timeSlotId;
        const newDateStr = data.date ?? existingReserve.date.toISOString().split('T')[0];
        
        // 如果變更了時段ID，檢查時段是否存在
        if (data.timeSlotId) {
             const timeSlot = await timeSlotModel.getTimeSlotById(data.timeSlotId);
            if (!timeSlot || !timeSlot.isActive) {
                throw new ValidationError("預約時段不存在或已停用");
            }
        }

        // 檢查新時段是否額滿 (如果是改到不同時段或不同天)
        // 注意：如果只是改服務(沒改時間)，不會進這裡
        const isTimeActuallyChanged = newTimeSlotId !== existingReserve.timeSlotId || 
                                     (data.date && new Date(data.date).getTime() !== new Date(existingReserve.date).getTime());

        if (isTimeActuallyChanged) {
             const reserveCount = await reserveModel.countActiveReservesByTimeSlotAndDate(newTimeSlotId, newDateStr);
            
             // 再次取得時段 capactiy (剛才可能沒取)
             // 為了效能，我們可以只在 ID 變更時取，但這裡為了保險起見，如果是日期變更但 ID 沒變，也要知道 capacity
             let capacity = 1;
             if (data.timeSlotId) {
                 // 有傳 ID，前面已經檢查並可取得 (雖然前面沒 return timeSlot) -> 為了簡化，直接再取一次或優化流程
                 const ts = await timeSlotModel.getTimeSlotById(newTimeSlotId);
                 capacity = ts?.capacity ?? 1;
             } else {
                 // 沒傳 ID (只改日期)，用舊 ID 查 capacity
                 const ts = await timeSlotModel.getTimeSlotById(existingReserve.timeSlotId);
                 capacity = ts?.capacity ?? 1;
             }

             if (reserveCount >= capacity) {
                 throw new ValidationError("該時段已額滿");
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

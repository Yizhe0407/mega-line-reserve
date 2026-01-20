import prisma from "../config/database";
import { UserProfile, CreateUserDTO } from "../types/user";

// 取得單一使用者 (根據 Line ID)
export const findUserByLineId = (lineId: string) => {
    return prisma.user.findUnique({
        where: { lineId },
    });
};

// 取得單一使用者 (根據 ID)
export const findUserById = (id: number) => {
    return prisma.user.findUnique({
        where: { id },
    });
};

// 建立使用者
export const createUser = (userData: CreateUserDTO) => {
    return prisma.user.create({
        // 既然 CreateUserDTO 的 key 與資料庫欄位一致，直接傳入即可
        data: userData, 
    });
};

// 更新使用者
export const updateUser = (id: number, data: Partial<CreateUserDTO>) => {
    return prisma.user.update({
        where: { id },
        // Prisma 會自動過濾掉 data 中為 undefined 的欄位
        data, 
    });
};

// 刪除使用者
export const deleteUser = (id: number) => {
    return prisma.user.delete({
        where: { id },
    });
};
import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { CreateUserDTO, UpdateUserDTO } from "../types/user";

/**
 * 使用者資料查詢的固定欄位白名單。
 *
 * 不直接回傳整個 Prisma model，避免資料表日後新增敏感欄位時被 API 意外帶出。
 */
const USER_PROFILE_SELECT = {
    id: true,
    lineId: true,
    name: true,
    pictureUrl: true,
    phone: true,
    license: true,
    role: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

// 取得單一使用者（根據 LINE ID）
export const findUserByLineId = (lineId: string) => {
    return prisma.user.findUnique({
        where: { lineId },
        select: USER_PROFILE_SELECT,
    });
};

// 取得單一使用者（根據 ID）
export const findUserById = (id: number) => {
    return prisma.user.findUnique({
        where: { id },
        select: USER_PROFILE_SELECT,
    });
};

// 建立使用者
export const createUser = (userData: CreateUserDTO) => {
    return prisma.user.create({
        data: userData,
        select: USER_PROFILE_SELECT,
    });
};

// 更新使用者
export const updateUser = (id: number, data: UpdateUserDTO) => {
    return prisma.user.update({
        where: { id },
        // Prisma 會自動忽略 data 中為 undefined 的欄位
        data,
        select: USER_PROFILE_SELECT,
    });
};

// 刪除使用者
export const deleteUser = (id: number) => {
    return prisma.user.delete({
        where: { id },
        select: USER_PROFILE_SELECT,
    });
};

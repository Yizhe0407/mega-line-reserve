import { UserRole } from "@prisma/client";

/**
 * 後端內部使用的完整會員資料。
 */
export interface UserProfile {
    id: number;
    lineId: string;
    name: string | null;
    pictureUrl: string | null;
    phone: string;
    license: string | null;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 使用者 API 可回傳的欄位白名單。
 *
 * 即使未來資料庫新增敏感欄位，也不會因直接序列化 Prisma model 而自動外洩。
 */
export type UserResponseDTO = Pick<
    UserProfile,
    | 'id'
    | 'lineId'
    | 'name'
    | 'pictureUrl'
    | 'phone'
    | 'license'
    | 'role'
    | 'createdAt'
    | 'updatedAt'
>;

export interface CreateUserDTO {
    lineId: string;
    name: string;
    pictureUrl?: string | null;
    phone: string;
    license?: string | null;
    role: UserRole;
}

/**
 * 一般使用者可自行更新的欄位白名單。
 */
export interface UpdateUserDTO {
    name?: string;
    pictureUrl?: string | null;
    phone?: string;
    license?: string | null;
}

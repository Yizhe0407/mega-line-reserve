import * as userModel from "../model/user";
import { UserProfile, CreateUserDTO } from "../types/user";
import { ValidationError, NotFoundError } from "../types/errors";
import { isValidLicense, normalizeLicense } from "../utils/validators";

export const getUserByLineId = async (lineIdParam: string | string[]) => {
    const lineId = Array.isArray(lineIdParam) ? lineIdParam[0] : lineIdParam;

    // 業務邏輯檢查：驗證 lineId 不為空
    if (!lineId || lineId.trim() === "") {
        throw new ValidationError("Line ID 不能為空");
    }

    return await userModel.findUserByLineId(lineId);
};

export const getUserById = async (idParam: string | string[]) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
    
    // 業務邏輯檢查：驗證 ID 為有效數字
    if (isNaN(id) || id <= 0) {
        throw new ValidationError("使用者 ID 必須為正整數");
    }

    const user = await userModel.findUserById(id);
    
    // 業務邏輯檢查：確認使用者存在
    if (!user) {
        throw new NotFoundError(`找不到 ID 為 ${id} 的使用者`);
    }

    return user;
};

export const createUser = async (userData: CreateUserDTO) => {
    // 業務邏輯檢查：驗證必填欄位
    if (!userData.lineId || userData.lineId.trim() === "") {
        throw new ValidationError("Line ID 為必填欄位");
    }
    if (!userData.name || userData.name.trim() === "") {
        throw new ValidationError("使用者名稱為必填欄位");
    }
    if (!userData.phone || userData.phone.trim() === "") {
        throw new ValidationError("電話號碼為必填欄位");
    }

    // 業務邏輯檢查：驗證電話號碼格式（台灣手機號碼）
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(userData.phone)) {
        throw new ValidationError("電話號碼格式不正確，應為 09 開頭的 10 位數字");
    }

    // 業務邏輯檢查：驗證車牌格式（台灣車牌）
    if (userData.license) {
        const normalizedLicense = normalizeLicense(userData.license);
        if (!isValidLicense(normalizedLicense)) {
            throw new ValidationError("車牌格式不正確，應為 2-4 個英文字母加 4 位數字（例如：ABC-1234），或舊式 1234-AA");
        }
        userData.license = normalizedLicense;
    }

    // 業務邏輯檢查：確認 Line ID 不重複
    const existingUser = await userModel.findUserByLineId(userData.lineId);
    if (existingUser) {
        throw new ValidationError(`Line ID ${userData.lineId} 已被使用`);
    }

    return await userModel.createUser(userData);
};

export const updateUser = async (idParam: string | string[], data: Partial<UserProfile>, currentUserId: number) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

    // 業務邏輯檢查：驗證 ID 為有效數字
    if (isNaN(id) || id <= 0) {
        throw new ValidationError("使用者 ID 必須為正整數");
    }

    // 業務邏輯檢查：權限驗證 - 使用者只能更新自己的資料
    if (id !== currentUserId) {
        throw new ValidationError("您只能更新自己的個人資訊");
    }

    // 業務邏輯檢查：確認使用者存在
    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
        throw new NotFoundError(`找不到 ID 為 ${id} 的使用者`);
    }

    // 業務邏輯檢查：驗證更新資料不為空
    if (!data || Object.keys(data).length === 0) {
        throw new ValidationError("更新資料不能為空");
    }

    // 業務邏輯檢查：驗證電話號碼格式（如果有更新）
    if (data.phone) {
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(data.phone)) {
            throw new ValidationError("電話號碼格式不正確，應為 09 開頭的 10 位數字");
        }
    }

    // 業務邏輯檢查：驗證車牌格式（如果有更新）
    if (data.license) {
        const normalizedLicense = normalizeLicense(data.license);
        if (!isValidLicense(normalizedLicense)) {
            throw new ValidationError("車牌格式不正確，應為 2-4 個英文字母加 4 位數字（例如：ABC-1234），或舊式 1234-AA");
        }
        data.license = normalizedLicense;
    }

    // 業務邏輯檢查：如果更新 Line ID，確認不重複
    if (data.lineId && data.lineId !== existingUser.lineId) {
        const duplicateUser = await userModel.findUserByLineId(data.lineId);
        if (duplicateUser) {
            throw new ValidationError(`Line ID ${data.lineId} 已被使用`);
        }
    }

    return await userModel.updateUser(id, data);
};

export const deleteUser = async (idParam: string | string[]) => {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);

    // 業務邏輯檢查：驗證 ID 為有效數字
    if (isNaN(id) || id <= 0) {
        throw new ValidationError("使用者 ID 必須為正整數");
    }

    // 業務邏輯檢查：確認使用者存在
    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
        throw new NotFoundError(`找不到 ID 為 ${id} 的使用者`);
    }

    return await userModel.deleteUser(id);
};

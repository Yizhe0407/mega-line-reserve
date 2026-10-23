import * as userModel from "../model/user";
import { CreateUserDTO, UpdateUserDTO } from "../types/user";
import { ValidationError, NotFoundError } from "../types/errors";
import { parsePositiveIntParam } from "../utils/params";
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
    const id = parsePositiveIntParam(idParam, "使用者");

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
            throw new ValidationError("車牌格式不正確，須為英數字組合（5-8碼，至少各含1個英文字母與數字），例如：ABC-1234");
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

export const updateUser = async (idParam: string | string[], data: UpdateUserDTO, currentUserId: number) => {
    const id = parsePositiveIntParam(idParam, "使用者");

    // 業務邏輯檢查：權限驗證 - 使用者只能更新自己的資料
    if (id !== currentUserId) {
        throw new ValidationError("您只能更新自己的個人資訊");
    }

    // 業務邏輯檢查：確認使用者存在
    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
        throw new NotFoundError(`找不到 ID 為 ${id} 的使用者`);
    }

    // 安全性：逐欄位複製白名單，避免 role、lineId 等敏感欄位進入資料層。
    const updateData: UpdateUserDTO = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.pictureUrl !== undefined) updateData.pictureUrl = data.pictureUrl;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.license !== undefined) updateData.license = data.license;

    // 業務邏輯檢查：驗證更新資料不為空
    if (Object.keys(updateData).length === 0) {
        throw new ValidationError("更新資料不能為空");
    }

    // 業務邏輯檢查：驗證電話號碼格式（如果有更新）
    if (updateData.phone !== undefined) {
        const phoneRegex = /^09\d{8}$/;
        if (!phoneRegex.test(updateData.phone)) {
            throw new ValidationError("電話號碼格式不正確，應為 09 開頭的 10 位數字");
        }
    }

    // 業務邏輯檢查：驗證車牌格式（如果有更新，null 代表清空，不需驗證格式）
    if (updateData.license !== undefined && updateData.license !== null) {
        const normalizedLicense = normalizeLicense(updateData.license);
        if (!isValidLicense(normalizedLicense)) {
            throw new ValidationError("車牌格式不正確，須為英數字組合（5-8碼，至少各含1個英文字母與數字），例如：ABC-1234");
        }
        updateData.license = normalizedLicense;
    }

    return await userModel.updateUser(id, updateData);
};

export const deleteUser = async (idParam: string | string[]) => {
    const id = parsePositiveIntParam(idParam, "使用者");

    // 業務邏輯檢查：確認使用者存在
    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
        throw new NotFoundError(`找不到 ID 為 ${id} 的使用者`);
    }

    return await userModel.deleteUser(id);
};

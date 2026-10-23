import * as reserveModel from "../model/reserve";
import { CreateReserveDTO, UpdateReserveDTO } from "../types/reserve";
import { ValidationError, NotFoundError } from "../types/errors";
import { Prisma, ReserveStatus, UserRole } from "@prisma/client";
import { isValidLicense, normalizeLicense } from "../utils/validators";
import { runSerializableTransaction } from "../utils/db";
import {
    formatDateOnly,
    isDateOnlyBeforeTaipeiToday,
    parseDateOnly,
    taipeiDateTimeToUtc,
} from "../utils/dateOnly";
import {
    RESERVE_INPUT_LIMITS,
    shouldCheckReserveCapacity,
} from "../utils/reservationRules";

const RESERVE_STATUSES = new Set<ReserveStatus>(Object.values(ReserveStatus));

const normalizeServiceIds = (serviceIds: number[]): number[] => {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        throw new ValidationError("請至少選擇一個服務");
    }

    if (serviceIds.length > RESERVE_INPUT_LIMITS.serviceIds) {
        throw new ValidationError(`服務項目不可超過 ${RESERVE_INPUT_LIMITS.serviceIds} 個`);
    }

    if (serviceIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
        throw new ValidationError("包含無效的服務 ID");
    }

    return Array.from(new Set(serviceIds));
};

const validateActiveServiceIds = async (
    serviceIds: number[],
    tx: Prisma.TransactionClient,
) => {
    const activeServiceCount = await reserveModel.countActiveServicesByIds(serviceIds, tx);
    if (activeServiceCount !== serviceIds.length) {
        throw new ValidationError("包含不存在或已停用的服務");
    }
};

const validateTimeSlotId = (timeSlotId: number) => {
    if (!Number.isSafeInteger(timeSlotId) || timeSlotId <= 0) {
        throw new ValidationError("請選擇有效的預約時段");
    }
};

const validateOptionalTextLength = (
    value: string | undefined,
    label: string,
    maxLength: number,
) => {
    if (value !== undefined && (typeof value !== "string" || value.length > maxLength)) {
        throw new ValidationError(`${label}不可超過 ${maxLength} 字`);
    }
};

const validateAndNormalizeLicense = (license: string): string => {
    if (typeof license !== "string" || license.length > RESERVE_INPUT_LIMITS.license) {
        throw new ValidationError(`車牌長度不可超過 ${RESERVE_INPUT_LIMITS.license} 字`);
    }

    const normalizedLicense = normalizeLicense(license);
    if (!isValidLicense(normalizedLicense)) {
        throw new ValidationError("車牌格式不正確，須為英數字組合（5-8碼，至少各含1個英文字母與數字），例如：ABC-1234");
    }

    return normalizedLicense;
};

const validateDateOnlyFormat = (date: unknown): string => {
    if (!parseDateOnly(date)) {
        throw new ValidationError("預約日期格式必須為 YYYY-MM-DD");
    }

    return date as string;
};

const validateReservationDateForTimeSlot = (
    date: string,
    dayOfWeek: number,
    startTime: string,
    now: Date = new Date(),
) => {
    const dateParts = parseDateOnly(date);
    if (!dateParts) {
        throw new ValidationError("預約日期格式必須為 YYYY-MM-DD");
    }

    if (isDateOnlyBeforeTaipeiToday(date, now)) {
        throw new ValidationError("預約日期不可早於今日");
    }

    if (dateParts.dayOfWeek !== dayOfWeek) {
        throw new ValidationError("預約日期與所選時段的星期不符");
    }

    // 新建、實際移動或恢復為占容量狀態時，不允許選擇台北今日已開始的時段
    if (taipeiDateTimeToUtc(date, startTime).getTime() <= now.getTime()) {
        throw new ValidationError("預約時段已開始或已過期");
    }
};

const parseReserveId = (idParam: string | string[]): number => {
    const rawId = Array.isArray(idParam) ? idParam[0] : idParam;
    if (typeof rawId !== "string" || !/^[1-9]\d*$/.test(rawId)) {
        throw new ValidationError("無效的預約 ID");
    }

    const id = Number(rawId);
    if (!Number.isSafeInteger(id)) {
        throw new ValidationError("無效的預約 ID");
    }

    return id;
};

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// 取得預約列表 (根據權限範圍)
// 管理端列表採分頁；一般使用者維持既有陣列回應，避免破壞前端歷史紀錄契約
export const getReserves = async (
    user: { id: number, role: UserRole },
    options?: { mineOnly?: boolean; page?: number; pageSize?: number }
) => {
    const mineOnly = options?.mineOnly ?? false;

    if (user.role === UserRole.ADMIN && !mineOnly) {
        const page = Math.max(1, Math.trunc(options?.page ?? 1));
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(options?.pageSize ?? DEFAULT_PAGE_SIZE)));
        return reserveModel.getAllReserves({ skip: (page - 1) * pageSize, take: pageSize });
    }
    return reserveModel.getReservesByUserId(user.id);
};

// 取得單一預約
export const getReserveById = async (idParam: string | string[], currentUserId: number, role: UserRole) => {
    const id = parseReserveId(idParam);
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
    validateTimeSlotId(data.timeSlotId);
    const reservationDate = validateDateOnlyFormat(data.date);

    if (!data.license || data.license.trim() === "") {
        throw new ValidationError("請提供車牌號碼");
    }

    validateOptionalTextLength(data.userMemo, "使用者備註", RESERVE_INPUT_LIMITS.memo);

    // 驗證並正規化車牌格式（與 user 更新端一致），避免 API 直打塞入髒資料
    const normalizedLicense = validateAndNormalizeLicense(data.license);
    const validServiceIds = normalizeServiceIds(data.serviceIds);
    const createPayload: CreateReserveDTO = {
        ...data,
        date: reservationDate,
        license: normalizedLicense,
        serviceIds: validServiceIds,
    };

    // 服務／時段讀取、日期規則、容量檢查與寫入都在 Serializable 交易內執行，
    // 避免服務或時段設定在驗證後改變，並防止容量超賣
    return runSerializableTransaction(async (tx) => {
        await validateActiveServiceIds(createPayload.serviceIds, tx);

        const timeSlot = await reserveModel.getTimeSlotForReservation(createPayload.timeSlotId, tx);
        if (!timeSlot || !timeSlot.isActive) {
            throw new ValidationError("預約時段不存在或已停用");
        }

        validateReservationDateForTimeSlot(
            createPayload.date,
            timeSlot.dayOfWeek,
            timeSlot.startTime,
        );

        const reserveCount = await reserveModel.countActiveReservesByTimeSlotAndDate(
            createPayload.timeSlotId,
            createPayload.date,
            tx,
        );
        if (reserveCount >= timeSlot.capacity) {
            throw new ValidationError("此時段已額滿");
        }

        return reserveModel.createReserve(userId, createPayload, tx);
    });
};

// 更新預約（依角色限制可更新欄位）
export const updateReserve = async (
    idParam: string | string[],
    data: UpdateReserveDTO,
    currentUserId: number,
    role: UserRole
) => {
    const id = parseReserveId(idParam);
    const updatePayload = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
    ) as UpdateReserveDTO;

    if (role === UserRole.CUSTOMER) {
        const forbiddenFields = [
            updatePayload.status !== undefined ? "預約狀態" : null,
            updatePayload.adminMemo !== undefined ? "管理員備註" : null,
        ].filter((field): field is string => field !== null);

        if (forbiddenFields.length > 0) {
            throw new ValidationError(`一般使用者無權修改：${forbiddenFields.join("、")}`);
        }
    }

    if (Object.keys(updatePayload).length === 0) {
        throw new ValidationError("至少需要提供一個可更新欄位");
    }

    if (updatePayload.timeSlotId !== undefined) {
        validateTimeSlotId(updatePayload.timeSlotId);
    }

    if (updatePayload.date !== undefined) {
        updatePayload.date = validateDateOnlyFormat(updatePayload.date);
    }

    if (updatePayload.status !== undefined && !RESERVE_STATUSES.has(updatePayload.status)) {
        throw new ValidationError("無效的預約狀態");
    }

    validateOptionalTextLength(updatePayload.userMemo, "使用者備註", RESERVE_INPUT_LIMITS.memo);
    validateOptionalTextLength(updatePayload.adminMemo, "管理員備註", RESERVE_INPUT_LIMITS.memo);

    if (updatePayload.license !== undefined) {
        updatePayload.license = validateAndNormalizeLicense(updatePayload.license);
    }

    if (updatePayload.serviceIds !== undefined) {
        updatePayload.serviceIds = normalizeServiceIds(updatePayload.serviceIds);
    }

    // 每次更新都在交易內重新讀取目前狀態；尤其 CANCELLED 恢復為占容量狀態時，
    // 必須依最新資料重新驗證時段與容量，不能只依交易外的舊快照判斷
    return runSerializableTransaction(async (tx) => {
        const existingReserve = await reserveModel.getReserveStateById(id, tx);
        if (!existingReserve) {
            throw new NotFoundError("找不到此預約");
        }

        if (role === UserRole.CUSTOMER && existingReserve.userId !== currentUserId) {
            throw new ValidationError("您無權修改此預約");
        }

        if (updatePayload.serviceIds !== undefined) {
            await validateActiveServiceIds(updatePayload.serviceIds, tx);
        }

        const existingDate = formatDateOnly(existingReserve.date);
        const nextDate = updatePayload.date ?? existingDate;
        const nextTimeSlotId = updatePayload.timeSlotId ?? existingReserve.timeSlotId;
        const nextStatus = updatePayload.status ?? existingReserve.status;
        const scheduleChanged = (
            nextTimeSlotId !== existingReserve.timeSlotId ||
            nextDate !== existingDate
        );
        const requiresCapacityCheck = shouldCheckReserveCapacity(
            existingReserve.status,
            nextStatus,
            scheduleChanged,
        );
        let timeSlot: Awaited<ReturnType<typeof reserveModel.getTimeSlotForReservation>> | null = null;
        // 只有實際移動或由 CANCELLED 恢復為占容量狀態時才重驗排程；
        // 前端重送相同 date/timeSlot 的一般內容修改不會被已開始時段阻擋
        if (requiresCapacityCheck) {
            timeSlot = await reserveModel.getTimeSlotForReservation(nextTimeSlotId, tx);
            if (!timeSlot || !timeSlot.isActive) {
                throw new ValidationError("預約時段不存在或已停用");
            }

            validateReservationDateForTimeSlot(
                nextDate,
                timeSlot.dayOfWeek,
                timeSlot.startTime,
            );
        }

        if (requiresCapacityCheck && timeSlot) {
            const reserveCount = await reserveModel.countActiveReservesByTimeSlotAndDate(
                nextTimeSlotId,
                nextDate,
                tx,
                existingReserve.id,
            );

            if (reserveCount >= timeSlot.capacity) {
                throw new ValidationError("該時段已額滿");
            }
        }

        return reserveModel.updateReserve(id, updatePayload, tx);
    });
};

// 刪除預約
export const deleteReserve = async (idParam: string | string[], currentUserId: number, role: UserRole) => {
    const id = parseReserveId(idParam);
    const existingReserve = await reserveModel.getReserveById(id);
    if (!existingReserve) {
        throw new NotFoundError("找不到此預約");
    }

    if (role === UserRole.CUSTOMER && existingReserve.userId !== currentUserId) {
        throw new ValidationError("您無權刪除此預約");
    }

    return reserveModel.deleteReserve(id);
};

export const BUSINESS_TIME_ZONE = "Asia/Taipei";

const TAIPEI_UTC_OFFSET_MINUTES = 8 * 60;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface DateOnlyParts {
    year: number;
    month: number;
    day: number;
    dayOfWeek: number;
}

// 嚴格解析 YYYY-MM-DD，避免 Date.parse 接受不存在日期或額外時間資訊
export const parseDateOnly = (value: unknown): DateOnlyParts | null => {
    if (typeof value !== "string") {
        return null;
    }

    const match = DATE_ONLY_PATTERN.exec(value);
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const utcDate = new Date(Date.UTC(year, month - 1, day));

    if (
        utcDate.getUTCFullYear() !== year ||
        utcDate.getUTCMonth() !== month - 1 ||
        utcDate.getUTCDate() !== day
    ) {
        return null;
    }

    return {
        year,
        month,
        day,
        dayOfWeek: utcDate.getUTCDay(),
    };
};

export const dateOnlyToUtcDate = (value: string): Date => {
    const parts = parseDateOnly(value);
    if (!parts) {
        throw new RangeError("Invalid YYYY-MM-DD date");
    }

    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
};

// Prisma 的 MySQL @db.Date 以 UTC 午夜 Date 表示，格式化時固定使用 UTC 欄位
export const formatDateOnly = (value: Date): string => {
    if (Number.isNaN(value.getTime())) {
        throw new RangeError("Invalid Date value");
    }

    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// 台北目前固定為 UTC+8；以位移後的 UTC 欄位取得業務日期，避免依賴容器本機 TZ
export const getTaipeiDateOnly = (value: Date = new Date()): string => {
    if (Number.isNaN(value.getTime())) {
        throw new RangeError("Invalid Date value");
    }

    const shifted = new Date(value.getTime() + TAIPEI_UTC_OFFSET_MINUTES * 60_000);
    return formatDateOnly(shifted);
};

export const isDateOnlyBeforeTaipeiToday = (dateValue: string, now: Date = new Date()): boolean => {
    if (!parseDateOnly(dateValue)) {
        throw new RangeError("Invalid YYYY-MM-DD date");
    }

    return dateValue < getTaipeiDateOnly(now);
};

// 將台北的預約日期與 HH:mm 明確轉成 UTC 時間，供排程進行絕對時間比較
export const taipeiDateTimeToUtc = (dateValue: string, timeValue: string): Date => {
    const dateParts = parseDateOnly(dateValue);
    const timeMatch = TIME_ONLY_PATTERN.exec(timeValue);

    if (!dateParts || !timeMatch) {
        throw new RangeError("Invalid Taipei date/time value");
    }

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const localTimeAsUtc = Date.UTC(
        dateParts.year,
        dateParts.month - 1,
        dateParts.day,
        hours,
        minutes,
    );
    return new Date(localTimeAsUtc - TAIPEI_UTC_OFFSET_MINUTES * 60_000);
};

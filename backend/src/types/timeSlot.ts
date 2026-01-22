export interface TimeSlot {
    id: number;
    dayOfWeek: number; // 0-6 (0=週日, 1=週一, ..., 6=週六)
    startTime: string; // 時間格式 "HH:mm"
    capacity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTimeSlotDTO {
    dayOfWeek: number;
    startTime: string;
    capacity?: number;
    isActive?: boolean;
}

export interface UpdateTimeSlotDTO {
    dayOfWeek?: number;
    startTime?: string;
    capacity?: number;
    isActive?: boolean;
}


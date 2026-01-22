import { ReserveStatus } from "@prisma/client";

export interface Reserve {
    id: number;
    userId: number;
    timeSlotId: number;
    license: string;
    status: ReserveStatus;
    userMemo?: string;
    adminMemo?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateReserveDTO {
    timeSlotId: number;
    license: string;
    serviceIds: number[];
    userMemo?: string;
    date: string;
    isPickup: boolean;
}

export interface UpdateReserveDTO {
    status?: ReserveStatus;
    adminMemo?: string;
    timeSlotId?: number;
    license?: string;
    date?: string;
    serviceIds?: number[];
    userMemo?: string;
    isPickup?: boolean;
}

import { ReserveStatus } from "@prisma/client";

export interface Reserve {
    id: number;
    userId: number;
    reservationTime: Date;
    license: string;
    status: ReserveStatus;
    userMemo?: string;
    adminMemo?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateReserveDTO {
    reservationTime: string | Date; // ISO string from frontend
    license: string;
    serviceIds: number[];
    userMemo?: string;
}

export interface UpdateReserveDTO {
    status?: ReserveStatus;
    adminMemo?: string;
    reservationTime?: string | Date;
    license?: string;
}

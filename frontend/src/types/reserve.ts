export enum ReserveStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Reserve {
  id: number;
  userId: number;
  timeSlotId: number;
  timeSlot?: {
    id: number;
    dayOfWeek: number;
    startTime: string;
  };
  license: string;
  status: ReserveStatus;
  userMemo?: string;
  adminMemo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReserveDTO {
  timeSlotId: number;
  license: string;
  serviceIds: number[];
  userMemo?: string;
}

export interface UpdateReserveDTO {
  status?: ReserveStatus;
  adminMemo?: string;
  timeSlotId?: number;
  license?: string;
}

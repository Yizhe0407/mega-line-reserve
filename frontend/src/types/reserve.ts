export enum ReserveStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Reserve {
  id: number;
  userId: number;
  reservationTime: string; // ISO string
  license: string;
  status: ReserveStatus;
  userMemo?: string;
  adminMemo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReserveDTO {
  reservationTime: string; // ISO string
  license: string;
  serviceIds: number[];
  userMemo?: string;
}

export interface UpdateReserveDTO {
  status?: ReserveStatus;
  adminMemo?: string;
  reservationTime?: string;
  license?: string;
}

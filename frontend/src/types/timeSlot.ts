export interface TimeSlot {
  id: number;
  dayOfWeek: number; // 0-6 (0=週日, 1=週一, ..., 6=週六)
  startTime: string; // 時間格式 "HH:mm"
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reserves: number;
  };
}


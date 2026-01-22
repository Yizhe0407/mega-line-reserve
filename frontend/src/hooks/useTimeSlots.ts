import { useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import liff from "@line/liff";
import { timeSlot as timeSlotApi } from "@/lib/api";
import type { TimeSlot } from "@/types";

export function useTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 按星期分組時段
  const groupedSlots = useMemo(() => {
    const groups: Record<number, TimeSlot[]> = {};
    timeSlots.forEach((slot) => {
      if (!groups[slot.dayOfWeek]) {
        groups[slot.dayOfWeek] = [];
      }
      groups[slot.dayOfWeek].push(slot);
    });
    // 每組內按時間排序
    Object.keys(groups).forEach((day) => {
      groups[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return groups;
  }, [timeSlots]);

  const loadTimeSlots = useCallback(async () => {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error("無法取得 ID token");
    }
    const data = await timeSlotApi.getAllTimeSlots(idToken);
    setTimeSlots(data);
  }, []);

  const createTimeSlot = useCallback(
    async (data: {
      dayOfWeek: number;
      startTime: string;
      capacity: number;
      isActive: boolean;
    }) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await timeSlotApi.createTimeSlot(data, idToken);
      await loadTimeSlots();
    },
    [loadTimeSlots]
  );

  const updateTimeSlot = useCallback(
    async (
      id: number,
      data: {
        dayOfWeek: number;
        startTime: string;
        capacity: number;
        isActive: boolean;
      }
    ) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await timeSlotApi.updateTimeSlot(id, data, idToken);
      await loadTimeSlots();
    },
    [loadTimeSlots]
  );

  const deleteTimeSlot = useCallback(
    async (id: number) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await timeSlotApi.deleteTimeSlot(id, idToken);
      await loadTimeSlots();
    },
    [loadTimeSlots]
  );

  const toggleActive = useCallback(
    async (slot: TimeSlot) => {
      try {
        setError(null);
        await updateTimeSlot(slot.id, {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          capacity: slot.capacity,
          isActive: !slot.isActive,
        });
        toast.success(slot.isActive ? "時段已停用" : "時段已啟用");
      } catch (err) {
        const message = err instanceof Error ? err.message : "更新失敗";
        setError(message);
        toast.error(message);
      }
    },
    [updateTimeSlot]
  );

  const copySlots = useCallback(
    async (sourceDay: number, targetDays: number[]) => {
      try {
        setError(null);
        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error("無法取得 ID token");
        }

        const sourceSlots = groupedSlots[sourceDay] || [];
        if (sourceSlots.length === 0) {
          throw new Error("來源日期沒有時段可複製");
        }

        // 對每個目標日期執行複製
        for (const targetDay of targetDays) {
          // 1. 刪除目標日期的所有時段
          const targetSlots = groupedSlots[targetDay] || [];
          await Promise.all(
            targetSlots.map((slot) => timeSlotApi.deleteTimeSlot(slot.id, idToken))
          );

          // 2. 複製來源日期的時段到目標日期
          const results = await Promise.allSettled(
            sourceSlots.map((slot) =>
              timeSlotApi.createTimeSlot(
                {
                  dayOfWeek: targetDay,
                  startTime: slot.startTime,
                  capacity: slot.capacity,
                  isActive: slot.isActive,
                },
                idToken
              )
            )
          );
          
          // 統計失敗是否僅因為重複
          const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
          if (failures.length > 0) {
            console.warn(`複製到週 ${targetDay} 時發生 ${failures.length} 個錯誤`, failures);
          }
        }

        await loadTimeSlots();
        toast.success(`已複製到 ${targetDays.length} 天`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "複製失敗";
        // 只有非重複時段的嚴重錯誤才顯示
        if (!message.includes("已存在")) {
           setError(message);
        }
        toast.error(message);
        throw err;
      }
    },
    [groupedSlots, loadTimeSlots]
  );

  return {
    timeSlots,
    groupedSlots,
    error,
    setError,
    loadTimeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    toggleActive,
    copySlots,
  };
}

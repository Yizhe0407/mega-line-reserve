import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import liff from "@line/liff";
import {
  getAllTimeSlots,
  createTimeSlot as createTimeSlotApi,
  updateTimeSlot as updateTimeSlotApi,
  deleteTimeSlot as deleteTimeSlotApi,
} from "@/lib/api/endpoints/timeSlot";
import type { TimeSlot } from "@/types";

export function useTimeSlots(enabled = true) {
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<TimeSlot[]>(
    enabled ? "admin-time-slots" : null,
    async () => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      const data = await getAllTimeSlots(idToken);
      return Array.isArray(data) ? data : [];
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const timeSlots = data ?? [];

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
    await mutate();
  }, [mutate]);

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
      await createTimeSlotApi(data, idToken);
      await mutate();
    },
    [mutate]
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
      await updateTimeSlotApi(id, data, idToken);
      await mutate();
    },
    [mutate]
  );

  const deleteTimeSlot = useCallback(
    async (id: number) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await deleteTimeSlotApi(id, idToken);
      await mutate();
    },
    [mutate]
  );

  const toggleActive = useCallback(
    async (slot: TimeSlot) => {
      try {
        setActionError(null);
        await updateTimeSlot(slot.id, {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          capacity: slot.capacity,
          isActive: !slot.isActive,
        });
        toast.success(slot.isActive ? "時段已停用" : "時段已啟用");
      } catch (err) {
        const message = err instanceof Error ? err.message : "更新失敗";
        setActionError(message);
        toast.error(message);
      }
    },
    [updateTimeSlot]
  );

  const copySlots = useCallback(
    async (sourceDay: number, targetDays: number[]) => {
      try {
        setActionError(null);
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
            targetSlots.map((slot) => deleteTimeSlotApi(slot.id, idToken))
          );

          // 2. 複製來源日期的時段到目標日期
          const results = await Promise.allSettled(
            sourceSlots.map((slot) =>
              createTimeSlotApi(
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

        await mutate();
        toast.success(`已複製到 ${targetDays.length} 天`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "複製失敗";
        // 只有非重複時段的嚴重錯誤才顯示
        if (!message.includes("已存在")) {
           setActionError(message);
        }
        toast.error(message);
        throw err;
      }
    },
    [groupedSlots, mutate]
  );

  const errorMessage =
    actionError ?? (error instanceof Error ? error.message : null);

  return {
    timeSlots,
    groupedSlots,
    error: errorMessage,
    setError: setActionError,
    loadTimeSlots,
    isLoading,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    toggleActive,
    copySlots,
  };
}

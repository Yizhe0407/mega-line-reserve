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

        let totalAdded = 0;
        let totalSkipped = 0;

        // 對每個目標日期執行複製（合併策略：只新增缺少的時段）
        for (const targetDay of targetDays) {
          const targetSlots = groupedSlots[targetDay] || [];
          const existingTimes = new Set(targetSlots.map((s) => s.startTime));

          // 只新增目標日期不存在的時段
          const slotsToAdd = sourceSlots.filter(
            (slot) => !existingTimes.has(slot.startTime)
          );

          const results = await Promise.allSettled(
            slotsToAdd.map((slot) =>
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

          totalAdded += results.filter((r) => r.status === "fulfilled").length;
          totalSkipped += sourceSlots.length - slotsToAdd.length;
        }

        await mutate();

        if (totalSkipped > 0) {
          toast.success(`已新增 ${totalAdded} 個時段，${totalSkipped} 個已存在跳過`);
        } else {
          toast.success(`已新增 ${totalAdded} 個時段到 ${targetDays.length} 天`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "複製失敗";
        setActionError(message);
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

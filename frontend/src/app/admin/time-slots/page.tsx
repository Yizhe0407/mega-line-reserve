"use client";

import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import liff from "@line/liff";
import { ensureLiffInit } from "@/lib/liff";
import { auth, timeSlot as timeSlotApi } from "@/lib/api";
import type { TimeSlot } from "@/types/timeSlot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WeeklyCalendarView } from "@/components/admin/time-slots/WeeklyCalendarView";
import { TimeSlotDialog } from "@/components/admin/time-slots/TimeSlotDialog";
import { CopySlotDialog } from "@/components/admin/time-slots/CopySlotDialog";
import { DeleteConfirmDialog } from "@/components/admin/time-slots/DeleteConfirmDialog";

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

// 生成時間選項 (7:00 ~ 18:00，每 30 分鐘一個時段)
const TIME_OPTIONS = Array.from({ length: 23 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30; // 從 7:00 開始
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export default function TimeSlotAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog 狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0);
  const [dialogTimes, setDialogTimes] = useState<string[]>([]); // 改為陣列支援多選
  const [dialogCapacity, setDialogCapacity] = useState(1);

  // 編輯狀態
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // 複製狀態
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<number>(0);
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([]);

  // 刪除確認狀態
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<TimeSlot | null>(null);

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

  const loadTimeSlots = async (token: string) => {
    const data = await timeSlotApi.getAllTimeSlots(token);
    setTimeSlots(data);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await ensureLiffInit({ withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) {
          setError("無法取得 ID token");
          return;
        }

        const me = await auth.getMe(idToken);
        if (me.user.role !== "ADMIN") {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);
        await loadTimeSlots(idToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const openAddDialog = (dayOfWeek: number) => {
    setSelectedDayOfWeek(dayOfWeek);
    setDialogTimes([]); // 新增模式清空選擇
    setDialogCapacity(1);
    setEditingSlot(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (slot: TimeSlot) => {
    setSelectedDayOfWeek(slot.dayOfWeek);
    setDialogTimes([slot.startTime]); // 編輯模式只有單一時間
    setDialogCapacity(slot.capacity);
    setEditingSlot(slot);
    setIsDialogOpen(true);
  };

  const toggleTimeSelection = (time: string) => {
    if (editingSlot) {
      // 編輯模式只能選一個
      setDialogTimes([time]);
    } else {
      // 新增模式可多選
      setDialogTimes((prev) =>
        prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
      );
    }
  };

  const openCopyDialog = (sourceDay: number) => {
    setCopySourceDay(sourceDay);
    setCopyTargetDays([]);
    setIsCopyDialogOpen(true);
  };

  const toggleTargetDay = (day: number) => {
    setCopyTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCopySlots = async () => {
    if (copyTargetDays.length === 0) {
      setError("請選擇至少一個目標日期");
      return;
    }
    try {
      setError(null);
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }

      const sourceSlots = groupedSlots[copySourceDay] || [];
      if (sourceSlots.length === 0) {
        setError("來源日期沒有時段可複製");
        return;
      }

      // 對每個目標日期執行複製
      for (const targetDay of copyTargetDays) {
        // 1. 刪除目標日期的所有時段
        const targetSlots = groupedSlots[targetDay] || [];
        await Promise.all(
          targetSlots.map((slot) => timeSlotApi.deleteTimeSlot(slot.id, idToken))
        );

        // 2. 複製來源日期的時段到目標日期
        await Promise.all(
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
      }

      setIsCopyDialogOpen(false);
      await loadTimeSlots(idToken);
      toast.success(`已複製到 ${copyTargetDays.length} 天`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "複製失敗");
      toast.error(err instanceof Error ? err.message : "複製失敗");
    }
  };

  const handleDialogSubmit = async () => {
    if (dialogTimes.length === 0) {
      setError("請選擇至少一個時間");
      return;
    }
    try {
      setError(null);
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }

      if (editingSlot) {
        // 更新（只會有一個時間）
        await timeSlotApi.updateTimeSlot(
          editingSlot.id,
          {
            dayOfWeek: selectedDayOfWeek,
            startTime: dialogTimes[0],
            capacity: dialogCapacity,
            isActive: editingSlot.isActive,
          },
          idToken
        );
        setIsDialogOpen(false);
        await loadTimeSlots(idToken);
        toast.success("時段已更新");
      } else {
        // 新增（可能有多個時間）
        const results = await Promise.allSettled(
          dialogTimes.map((time) =>
            timeSlotApi.createTimeSlot(
              {
                dayOfWeek: selectedDayOfWeek,
                startTime: time,
                capacity: dialogCapacity,
                isActive: true,
              },
              idToken
            )
          )
        );

        const successCount = results.filter((r) => r.status === "fulfilled").length;
        const failedCount = results.filter((r) => r.status === "rejected").length;

        setIsDialogOpen(false);
        await loadTimeSlots(idToken);

        if (failedCount === 0) {
          toast.success(`已新增 ${successCount} 個時段`);
        } else if (successCount === 0) {
          const firstError = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
          toast.error(firstError.reason?.message || "新增失敗");
        } else {
          toast.success(`已新增 ${successCount} 個時段，${failedCount} 個失敗（可能已存在）`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失敗");
      toast.error(err instanceof Error ? err.message : "操作失敗");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await timeSlotApi.deleteTimeSlot(id, idToken);
      setIsDeleteDialogOpen(false);
      setSlotToDelete(null);
      await loadTimeSlots(idToken);
      toast.success("時段已刪除");
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
      toast.error(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const openDeleteDialog = (slot: TimeSlot) => {
    setSlotToDelete(slot);
    setIsDeleteDialogOpen(true);
  };

  const toggleActive = async (slot: TimeSlot) => {
    try {
      setError(null);
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      const newIsActive = !slot.isActive;
      await timeSlotApi.updateTimeSlot(
        slot.id,
        {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          capacity: slot.capacity,
          isActive: newIsActive,
        },
        idToken
      );
      // 立即更新 editingSlot 狀態
      setEditingSlot({ ...slot, isActive: newIsActive });
      await loadTimeSlots(idToken);
      toast.success(slot.isActive ? "時段已停用" : "時段已啟用");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失敗");
      toast.error(err instanceof Error ? err.message : "更新失敗");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>時段管理</CardTitle>
          </CardHeader>
          <CardContent>載入中...</CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>時段管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>權限不足</AlertTitle>
              <AlertDescription>此頁面僅提供管理員使用。</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")}>回首頁</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">時段管理</h1>

        {error && (
          <Alert>
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <WeeklyCalendarView
          weekdays={WEEKDAYS}
          groupedSlots={groupedSlots}
          onAddSlot={openAddDialog}
          onEditSlot={openEditDialog}
          onCopyDay={openCopyDialog}
        />
      </div>

      <TimeSlotDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        weekdays={WEEKDAYS}
        timeOptions={TIME_OPTIONS}
        selectedDayOfWeek={selectedDayOfWeek}
        selectedTimes={dialogTimes}
        capacity={dialogCapacity}
        editingSlot={editingSlot}
        onTimeToggle={toggleTimeSelection}
        onCapacityChange={setDialogCapacity}
        onSubmit={handleDialogSubmit}
        onToggleActive={editingSlot ? () => toggleActive(editingSlot) : undefined}
        onDelete={
          editingSlot
            ? () => {
                setIsDialogOpen(false);
                openDeleteDialog(editingSlot);
              }
            : undefined
        }
      />

      <CopySlotDialog
        open={isCopyDialogOpen}
        onOpenChange={setIsCopyDialogOpen}
        weekdays={WEEKDAYS}
        sourceDay={copySourceDay}
        targetDays={copyTargetDays}
        slotCount={groupedSlots[copySourceDay]?.length || 0}
        onToggleTargetDay={toggleTargetDay}
        onConfirm={handleCopySlots}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) setSlotToDelete(null);
        }}
        slot={slotToDelete}
        weekdays={WEEKDAYS}
        onConfirm={() => slotToDelete && handleDelete(slotToDelete.id)}
      />
    </div>
  );
}

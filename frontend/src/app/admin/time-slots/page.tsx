"use client";

import toast from "react-hot-toast";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WeeklyCalendarView } from "@/components/admin/time-slots/WeeklyCalendarView";
import { TimeSlotDialog } from "@/components/admin/time-slots/TimeSlotDialog";
import { CopySlotDialog } from "@/components/admin/time-slots/CopySlotDialog";
import { DeleteConfirmDialog } from "@/components/admin/time-slots/DeleteConfirmDialog";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useTimeSlotDialog } from "@/hooks/useTimeSlotDialog";
import { useCopySlotDialog } from "@/hooks/useCopySlotDialog";
import { useDeleteConfirmDialog } from "@/hooks/useDeleteConfirmDialog";

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
  const { isAdmin, isLoading, error: authError } = useAdminAuth();
  const {
    groupedSlots,
    error: slotsError,
    setError: setSlotsError,
    loadTimeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    toggleActive,
    copySlots,
  } = useTimeSlots();

  const timeSlotDialog = useTimeSlotDialog();
  const copyDialog = useCopySlotDialog();
  const deleteDialog = useDeleteConfirmDialog();

  // 初始載入時段
  useEffect(() => {
    if (isAdmin) {
      loadTimeSlots();
    }
  }, [isAdmin, loadTimeSlots]);

  const handleDialogSubmit = async () => {
    if (timeSlotDialog.selectedTimes.length === 0) {
      setSlotsError("請選擇至少一個時間");
      return;
    }
    try {
      setSlotsError(null);

      if (timeSlotDialog.editingSlot) {
        // 更新（只會有一個時間）
        await updateTimeSlot(timeSlotDialog.editingSlot.id, {
          dayOfWeek: timeSlotDialog.selectedDayOfWeek,
          startTime: timeSlotDialog.selectedTimes[0],
          capacity: timeSlotDialog.capacity,
          isActive: timeSlotDialog.editingSlot.isActive,
        });
        timeSlotDialog.closeDialog();
        toast.success("時段已更新");
      } else {
        // 新增（可能有多個時間）
        const results = await Promise.allSettled(
          timeSlotDialog.selectedTimes.map((time) =>
            createTimeSlot({
              dayOfWeek: timeSlotDialog.selectedDayOfWeek,
              startTime: time,
              capacity: timeSlotDialog.capacity,
              isActive: true,
            })
          )
        );

        const successCount = results.filter((r) => r.status === "fulfilled").length;
        const failedCount = results.filter((r) => r.status === "rejected").length;

        timeSlotDialog.closeDialog();

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
      const message = err instanceof Error ? err.message : "操作失敗";
      setSlotsError(message);
      toast.error(message);
    }
  };

  const handleCopySlots = async () => {
    if (copyDialog.targetDays.length === 0) {
      setSlotsError("請選擇至少一個目標日期");
      return;
    }
    try {
      await copySlots(copyDialog.sourceDay, copyDialog.targetDays);
      copyDialog.closeDialog();
    } catch (err) {
      // 錯誤已在 copySlots 中處理
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.slotToDelete) return;
    try {
      setSlotsError(null);
      await deleteTimeSlot(deleteDialog.slotToDelete.id);
      deleteDialog.closeDialog();
      toast.success("時段已刪除");
    } catch (err) {
      const message = err instanceof Error ? err.message : "刪除失敗";
      setSlotsError(message);
      toast.error(message);
    }
  };

  const handleToggleActive = async () => {
    if (!timeSlotDialog.editingSlot) return;
    await toggleActive(timeSlotDialog.editingSlot);
    // 更新 dialog 中的 editingSlot 狀態
    timeSlotDialog.setEditingSlot({
      ...timeSlotDialog.editingSlot,
      isActive: !timeSlotDialog.editingSlot.isActive,
    });
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

  const error = authError || slotsError;

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
          onAddSlot={timeSlotDialog.openAddDialog}
          onEditSlot={timeSlotDialog.openEditDialog}
          onCopyDay={copyDialog.openDialog}
        />
      </div>

      <TimeSlotDialog
        open={timeSlotDialog.isOpen}
        onOpenChange={timeSlotDialog.setIsOpen}
        weekdays={WEEKDAYS}
        timeOptions={TIME_OPTIONS}
        selectedDayOfWeek={timeSlotDialog.selectedDayOfWeek}
        selectedTimes={timeSlotDialog.selectedTimes}
        capacity={timeSlotDialog.capacity}
        editingSlot={timeSlotDialog.editingSlot}
        onTimeToggle={timeSlotDialog.toggleTimeSelection}
        onCapacityChange={timeSlotDialog.setCapacity}
        onSubmit={handleDialogSubmit}
        onToggleActive={timeSlotDialog.editingSlot ? handleToggleActive : undefined}
        onDelete={
          timeSlotDialog.editingSlot
            ? () => {
                timeSlotDialog.closeDialog();
                deleteDialog.openDialog(timeSlotDialog.editingSlot!);
              }
            : undefined
        }
      />

      <CopySlotDialog
        open={copyDialog.isOpen}
        onOpenChange={copyDialog.setIsOpen}
        weekdays={WEEKDAYS}
        sourceDay={copyDialog.sourceDay}
        targetDays={copyDialog.targetDays}
        slotCount={groupedSlots[copyDialog.sourceDay]?.length || 0}
        onToggleTargetDay={copyDialog.toggleTargetDay}
        onConfirm={handleCopySlots}
      />

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        slot={deleteDialog.slotToDelete}
        weekdays={WEEKDAYS}
        onConfirm={handleDelete}
      />
    </div>
  );
}

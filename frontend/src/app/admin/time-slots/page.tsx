"use client";

import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WeeklyCalendarView } from "@/components/admin/time-slots/WeeklyCalendarView";
import { ArrowLeft, Clock } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTimeSlots } from "@/hooks/useTimeSlots";
import { useTimeSlotDialog } from "@/hooks/useTimeSlotDialog";
import { useCopySlotDialog } from "@/hooks/useCopySlotDialog";
import { useDeleteConfirmDialog } from "@/hooks/useDeleteConfirmDialog";

const TimeSlotDialog = dynamic(
  () => import("@/components/admin/time-slots/TimeSlotDialog").then((mod) => mod.TimeSlotDialog),
  { ssr: false }
);
const CopySlotDialog = dynamic(
  () => import("@/components/admin/time-slots/CopySlotDialog").then((mod) => mod.CopySlotDialog),
  { ssr: false }
);
const DeleteConfirmDialog = dynamic(
  () =>
    import("@/components/admin/time-slots/DeleteConfirmDialog").then(
      (mod) => mod.DeleteConfirmDialog
    ),
  { ssr: false }
);

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

// 生成時間選項 (7:00 ~ 18:00，每 30 分鐘一個時段)
const TIME_OPTIONS = Array.from({ length: 23 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30; // 從 7:00 開始
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export default function TimeSlotAdminPage() {
  const { isAdmin, isLoading: isAuthLoading, error: authError } = useAdminAuth();
  const {
    groupedSlots,
    error: slotsError,
    setError: setSlotsError,
    isLoading: isSlotsLoading,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    toggleActive,
    copySlots,
  } = useTimeSlots(isAdmin === true);

  const timeSlotDialog = useTimeSlotDialog();
  const copyDialog = useCopySlotDialog();
  const deleteDialog = useDeleteConfirmDialog();

  const isDataLoading = isAuthLoading || (isAdmin ? isSlotsLoading : false);

  const handleDialogSubmit = async () => {
    if (timeSlotDialog.selectedTimes.length === 0) {
      setSlotsError("請選擇至少一個時間");
      return;
    }
    timeSlotDialog.setIsSubmitting(true);
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
      // 忽略已存在的錯誤，只顯示 toast
      if (!message.includes("已存在")) {
        setSlotsError(message);
      }
      toast.error(message);
    } finally {
      timeSlotDialog.setIsSubmitting(false);
    }
  };

  const handleCopySlots = async () => {
    if (copyDialog.targetDays.length === 0) {
      setSlotsError("請選擇至少一個目標日期");
      console.log(slotsError); // Added to use slotsError
      return;
    }
    copyDialog.setIsLoading(true);
    try {
      await copySlots(copyDialog.sourceDay, copyDialog.targetDays);
      copyDialog.closeDialog();
    } catch (err) {
      // 錯誤已在 copySlots 中處理，這裡不需要額外設定 slotsError
    } finally {
      copyDialog.setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.itemToDelete) return;
    deleteDialog.setIsLoading(true);
    try {
      setSlotsError(null);
      await deleteTimeSlot(deleteDialog.itemToDelete.id);
      deleteDialog.closeDialog();
      toast.success("時段已刪除");
    } catch (err) {
      const message = err instanceof Error ? err.message : "刪除失敗";
      setSlotsError(message);
      toast.error(message);
    } finally {
      deleteDialog.setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!timeSlotDialog.editingSlot) return;
    timeSlotDialog.setIsToggling(true);
    try {
      await toggleActive(timeSlotDialog.editingSlot);
      // 更新 dialog 中的 editingSlot 狀態
      timeSlotDialog.setEditingSlot({
        ...timeSlotDialog.editingSlot,
        isActive: !timeSlotDialog.editingSlot.isActive,
      });
    } finally {
      timeSlotDialog.setIsToggling(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
          <div className="w-12 h-12 bg-muted rounded-xl" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive">權限不足</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
             <p className="text-muted-foreground">此頁面僅提供管理員使用。</p>
            <Link 
              href="/" 
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-8 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              回首頁
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const error = authError || slotsError;

  return (
    <div className="pb-20">
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
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
      </main>

      <TimeSlotDialog
        open={timeSlotDialog.isOpen}
        onOpenChange={timeSlotDialog.setIsOpen}
        weekdays={WEEKDAYS}
        timeOptions={TIME_OPTIONS}
        selectedDayOfWeek={timeSlotDialog.selectedDayOfWeek}
        selectedTimes={timeSlotDialog.selectedTimes}
        capacity={timeSlotDialog.capacity}
        editingSlot={timeSlotDialog.editingSlot}
        isSubmitting={timeSlotDialog.isSubmitting}
        isToggling={timeSlotDialog.isToggling}
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
        isLoading={copyDialog.isLoading}
        onToggleTargetDay={copyDialog.toggleTargetDay}
        onConfirm={handleCopySlots}
      />

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        slot={deleteDialog.itemToDelete}
        weekdays={WEEKDAYS}
        isLoading={deleteDialog.isLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}

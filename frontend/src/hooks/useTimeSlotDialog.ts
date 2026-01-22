import { useState, useCallback } from "react";
import type { TimeSlot } from "@/types/timeSlot";

export function useTimeSlotDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(0);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(1);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const openAddDialog = useCallback((dayOfWeek: number) => {
    setSelectedDayOfWeek(dayOfWeek);
    setSelectedTimes([]);
    setCapacity(1);
    setEditingSlot(null);
    setIsOpen(true);
  }, []);

  const openEditDialog = useCallback((slot: TimeSlot) => {
    setSelectedDayOfWeek(slot.dayOfWeek);
    setSelectedTimes([slot.startTime]);
    setCapacity(slot.capacity);
    setEditingSlot(slot);
    setIsOpen(true);
  }, []);

  const toggleTimeSelection = useCallback(
    (time: string) => {
      if (editingSlot) {
        // 編輯模式只能選一個
        setSelectedTimes([time]);
      } else {
        // 新增模式可多選
        setSelectedTimes((prev) =>
          prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
        );
      }
    },
    [editingSlot]
  );

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    selectedDayOfWeek,
    selectedTimes,
    capacity,
    editingSlot,
    isSubmitting,
    isToggling,
    setIsOpen,
    setCapacity,
    setEditingSlot,
    setIsSubmitting,
    setIsToggling,
    openAddDialog,
    openEditDialog,
    toggleTimeSelection,
    closeDialog,
  };
}

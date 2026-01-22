import { useState, useCallback } from "react";
import type { TimeSlot } from "@/types/timeSlot";

export function useDeleteConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<TimeSlot | null>(null);

  const openDialog = useCallback((slot: TimeSlot) => {
    setSlotToDelete(slot);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setSlotToDelete(null);
  }, []);

  return {
    isOpen,
    slotToDelete,
    setIsOpen,
    openDialog,
    closeDialog,
  };
}

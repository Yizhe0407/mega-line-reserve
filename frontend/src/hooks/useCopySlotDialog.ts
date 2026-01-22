import { useState, useCallback } from "react";

export function useCopySlotDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceDay, setSourceDay] = useState<number>(0);
  const [targetDays, setTargetDays] = useState<number[]>([]);

  const openDialog = useCallback((day: number) => {
    setSourceDay(day);
    setTargetDays([]);
    setIsOpen(true);
  }, []);

  const toggleTargetDay = useCallback((day: number) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    sourceDay,
    targetDays,
    setIsOpen,
    openDialog,
    toggleTargetDay,
    closeDialog,
  };
}

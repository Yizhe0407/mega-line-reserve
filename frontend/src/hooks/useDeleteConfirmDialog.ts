import { useState, useCallback } from "react";

export function useDeleteConfirmDialog<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = useCallback((item: T) => {
    setItemToDelete(item);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setItemToDelete(null);
  }, []);

  return {
    isOpen,
    itemToDelete,
    isLoading,
    setIsOpen,
    setIsLoading,
    openDialog,
    closeDialog,
  };
}

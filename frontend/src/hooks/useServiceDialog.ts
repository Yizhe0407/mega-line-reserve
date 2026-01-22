import { useState, useCallback } from "react";
import type { Service } from "@/types";

export function useServiceDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const openAddDialog = useCallback(() => {
    setName("");
    setDescription("");
    setPrice(undefined);
    setDuration(undefined);
    setEditingService(null);
    setIsOpen(true);
  }, []);

  const openEditDialog = useCallback((service: Service) => {
    setName(service.name);
    setDescription(service.description || "");
    setPrice(service.price || undefined);
    setDuration(service.duration || undefined);
    setEditingService(service);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setPrice(undefined);
    setDuration(undefined);
    setEditingService(null);
  }, []);

  return {
    isOpen,
    name,
    description,
    price,
    duration,
    editingService,
    setIsOpen,
    setName,
    setDescription,
    setPrice,
    setDuration,
    setEditingService,
    openAddDialog,
    openEditDialog,
    closeDialog,
    resetForm,
  };
}

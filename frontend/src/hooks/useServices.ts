import { useState, useCallback } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import liff from "@line/liff";
import {
  getAllServices,
  createService as createServiceApi,
  updateService as updateServiceApi,
  deleteService as deleteServiceApi,
} from "@/lib/api/endpoints/service";
import type { Service, CreateServiceDTO, UpdateServiceDTO } from "@/types";

export function useServices(enabled = true) {
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<Service[]>(
    enabled ? "admin-services" : null,
    async () => {
      const data = await getAllServices();
      return Array.isArray(data) ? data : [];
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const loadServices = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const createService = useCallback(
    async (data: CreateServiceDTO) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await createServiceApi(data, idToken);
      await mutate();
    },
    [mutate]
  );

  const updateService = useCallback(
    async (id: number, data: UpdateServiceDTO) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await updateServiceApi(id, data, idToken);
      await mutate();
    },
    [mutate]
  );

  const deleteService = useCallback(
    async (id: number) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await deleteServiceApi(id, idToken);
      await mutate();
    },
    [mutate]
  );

  const toggleActive = useCallback(
    async (service: Service) => {
      try {
        setActionError(null);
        await updateService(service.id, {
          isActive: !service.isActive,
        });
        toast.success(service.isActive ? "服務已停用" : "服務已啟用");
      } catch (err) {
        const message = err instanceof Error ? err.message : "更新失敗";
        setActionError(message);
        toast.error(message);
      }
    },
    [updateService]
  );

  const errorMessage =
    actionError ?? (error instanceof Error ? error.message : null);

  return {
    services: data ?? [],
    isLoading,
    error: errorMessage,
    setError: setActionError,
    loadServices,
    createService,
    updateService,
    deleteService,
    toggleActive,
  };
}

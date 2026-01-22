import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import liff from "@line/liff";
import { service as serviceApi } from "@/lib/api";
import type { Service, CreateServiceDTO, UpdateServiceDTO } from "@/types";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    try {
      const data = await serviceApi.getAllServices();
      setServices(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "載入失敗";
      setError(message);
      throw err;
    }
  }, []);

  const createService = useCallback(
    async (data: CreateServiceDTO) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await serviceApi.createService(data, idToken);
      await loadServices();
    },
    [loadServices]
  );

  const updateService = useCallback(
    async (id: number, data: UpdateServiceDTO) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await serviceApi.updateService(id, data, idToken);
      await loadServices();
    },
    [loadServices]
  );

  const deleteService = useCallback(
    async (id: number) => {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await serviceApi.deleteService(id, idToken);
      await loadServices();
    },
    [loadServices]
  );

  const toggleActive = useCallback(
    async (service: Service) => {
      try {
        setError(null);
        await updateService(service.id, {
          isActive: !service.isActive,
        });
        toast.success(service.isActive ? "服務已停用" : "服務已啟用");
      } catch (err) {
        const message = err instanceof Error ? err.message : "更新失敗";
        setError(message);
        toast.error(message);
      }
    },
    [updateService]
  );

  return {
    services,
    error,
    setError,
    loadServices,
    createService,
    updateService,
    deleteService,
    toggleActive,
  };
}

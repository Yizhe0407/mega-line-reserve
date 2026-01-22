'use client';

import { useCallback, useEffect } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { getAllServices } from '@/lib/api/endpoints/service';
import { useStepStore } from '@/store/step-store';

export function useStepServices() {
  const cachedServices = useStepStore((state) => state.services);
  const setServices = useStepStore((state) => state.setServices);

  const fetcher = useCallback(async () => {
    try {
      const data = await getAllServices();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('無法載入服務列表');
      return [];
    }
  }, []);

  const { data, error, isLoading, mutate } = useSWR('step-services', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  useEffect(() => {
    if (data && data.length > 0) {
      setServices(data);
    }
  }, [data, setServices]);

  const fetchServices = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    services: data ?? cachedServices,
    isLoading,
    error,
    fetchServices,
  };
}

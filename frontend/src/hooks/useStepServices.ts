'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAllServices } from '@/lib/api/endpoints/service';
import { useStepStore } from '@/store/step-store';

export function useStepServices() {
  const services = useStepStore((state) => state.services);
  const setServices = useStepStore((state) => state.setServices);

  const fetchServices = useCallback(async () => {
    if (services.length > 0) {
      return;
    }
    try {
      const data = await getAllServices();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('無法載入服務列表');
    }
  }, [services, setServices]);

  return { services, fetchServices };
}

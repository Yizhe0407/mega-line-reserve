'use client';

import useSWR from 'swr';
import { getActiveTimeSlots } from '@/lib/api/endpoints/timeSlot';
import type { TimeSlot } from '@/types';

const fetcher = async (): Promise<TimeSlot[]> => {
  const data = await getActiveTimeSlots();
  return Array.isArray(data) ? data : [];
};

export function useActiveTimeSlots() {
  const { data, error, isLoading, mutate } = useSWR<TimeSlot[]>(
    'active-time-slots',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  return {
    timeSlots: data ?? [],
    error,
    isLoading,
    refresh: mutate,
  };
}

'use client';

import useSWR from 'swr';
import { getAvailableTimeSlots } from '@/lib/api/endpoints/timeSlot';
import type { TimeSlot } from '@/types';

const fetcher = async (date: string): Promise<TimeSlot[]> => {
  if (!date) return [];
  const data = await getAvailableTimeSlots(date);
  return Array.isArray(data) ? data : [];
};

export function useAvailableTimeSlots(date: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TimeSlot[]>(
    date ? `available-time-slots-${date}` : null,
    () => fetcher(date!),
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

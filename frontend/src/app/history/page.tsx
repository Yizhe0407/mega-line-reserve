'use client';
import { memo, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import liff from '@line/liff';
import { useStepStore } from '@/store/step-store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { cn } from '@/lib/utils';
import { PlusCircle, AlertCircle, Trash2, ChevronRight, Car, Pencil, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Reserve, Service, UpdateReserveDTO } from '@/types';
import EditReservationDialog from '@/components/EditReservationDialog';
import { toast } from 'react-hot-toast';
import { useLiffMessage } from '@/hooks/useLiffMessage';
import { format } from 'date-fns';
import { useStepServices } from '@/hooks/useStepServices';
import { getReserves, updateReserve, deleteReserve } from '@/lib/api/endpoints/reserve';

interface ReserveServiceItem {
  service: Service;
}

interface ReserveWithServices extends Reserve {
  services: ReserveServiceItem[];
}

interface ReservationCardProps {
  reserve: ReserveWithServices;
  onOpenDetail: (reserve: ReserveWithServices) => void;
}

interface UpdateReservationMessageData {
  date: string;
  time: string;
  license: string;
  serviceNames: string[];
  isPickup: boolean;
}

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
const STATUS_LABELS = {
  upcoming: '即將到來',
  done: '已完成',
  cancelled: '已取消',
} as const;

const getReserveIsPast = (reserve: ReserveWithServices, now: Date) => {
  const startTime = reserve.timeSlot?.startTime ?? '00:00';
  const reserveDate = reserve.date ? new Date(reserve.date) : new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  reserveDate.setHours(hours, minutes, 0, 0);
  return reserve.date ? now > reserveDate : false;
};

const getReserveStatusKey = (reserve: ReserveWithServices, now: Date) => {
  if (reserve.status === 'CANCELLED') return 'cancelled' as const;
  if (reserve.status === 'COMPLETED' || getReserveIsPast(reserve, now)) return 'done' as const;
  return 'upcoming' as const;
};

const ReservationCard = memo(({ reserve, onOpenDetail }: ReservationCardProps) => {
  const dayOfWeek = reserve.timeSlot?.dayOfWeek ?? 0;
  const startTime = reserve.timeSlot?.startTime ?? '00:00';
  const weekdayName = WEEKDAYS[dayOfWeek];
  
  const now = new Date();
  const statusKey = getReserveStatusKey(reserve, now);

  const statusText = STATUS_LABELS[statusKey];
  const statusClass = statusKey === 'upcoming'
    ? 'bg-emerald-50 text-emerald-600'
    : statusKey === 'cancelled'
      ? 'border border-red-200 text-red-500 bg-transparent'
      : 'bg-neutral-100 text-neutral-600';

  const dateValue = reserve.date ? new Date(reserve.date) : new Date();
  const monthText = reserve.date ? format(dateValue, 'M月') : '—';
  const dayText = reserve.date ? format(dateValue, 'd') : '—';
  const serviceNames = reserve.services.map((item) => item.service.name).join(' / ');

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(reserve)}
      className="w-full text-left"
    >
      <div className="flex items-center gap-4 rounded-3xl bg-white px-4 py-4 shadow-[0_6px_16px_rgba(15,15,15,0.04)] transition hover:-translate-y-0.5">
        <div className="flex h-[58px] w-[58px] flex-col items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <span className="text-xs font-medium opacity-80">{monthText}</span>
          <span className="text-xl font-semibold leading-none">{dayText}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-neutral-900">{startTime}</span>
            <span className="text-sm text-neutral-500">{weekdayName}</span>
          </div>
          <div className="mt-1 text-sm text-neutral-500 truncate">
            {serviceNames || '未指定服務'}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <span className={cn('rounded-full px-2.5 py-1 font-medium', statusClass)}>{statusText}</span>
            <span className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />
              到府牽車
            </span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-300" />
      </div>
    </button>
  );
});

ReservationCard.displayName = "ReservationCard";

export default function RecordPage() {
  const userId = useStepStore((state) => state.userId);
  const { sendUpdateLineMessage, sendCancelLineMessage } = useLiffMessage();
  useStepServices();

  // Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReserve, setEditingReserve] = useState<ReserveWithServices | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailReserve, setDetailReserve] = useState<ReserveWithServices | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ReserveWithServices | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const {
    data: reservations = [],
    error,
    isLoading,
    mutate,
  } = useSWR<ReserveWithServices[]>(
    ['reserves', userId ?? 'anonymous'],
    async () => {
      const idToken = liff.getIDToken();
      if (!idToken) throw new Error('無法取得 ID token。');

      const data = (await getReserves(idToken)) as ReserveWithServices[];
      return data;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  );

  const handleOpenDetail = useCallback((reserve: ReserveWithServices) => {
    setDetailReserve(reserve);
    setIsDetailDialogOpen(true);
  }, []);

  const handleCancelClick = useCallback((reserve: ReserveWithServices) => {
    setIsDetailDialogOpen(false);
    setCancelTarget(reserve);
    setIsCancelDialogOpen(true);
  }, []);

  const handleCancelReservation = useCallback(async () => {
    if (!cancelTarget) return;

    setIsCancelling(true);
    try {
      const idToken = liff.getIDToken();
      if (!idToken) throw new Error('無法取得 ID token。');
      
      await deleteReserve(cancelTarget.id, idToken);

      const formattedDate = cancelTarget.date ? format(new Date(cancelTarget.date), 'yyyy-M-d') : '';
      const startTime = cancelTarget.timeSlot?.startTime ?? '';
      const serviceNames = cancelTarget.services.map((item) => item.service.name);

      await sendCancelLineMessage({
        date: formattedDate,
        time: startTime,
        license: cancelTarget.license,
        serviceNames,
        isPickup: cancelTarget.isPickup,
      });

      mutate((current) => current?.filter((r) => r.id !== cancelTarget.id), false);
      toast.success('預約已取消');
      setIsCancelDialogOpen(false);
      setCancelTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '發生未知錯誤。');
    } finally {
      setIsCancelling(false);
    }
  }, [cancelTarget, mutate, sendCancelLineMessage]);

  const handleEditClick = useCallback((reserve: ReserveWithServices) => {
    setIsDetailDialogOpen(false);
    setEditingReserve(reserve);
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateReservation = useCallback(async (
    id: number,
    data: UpdateReserveDTO,
    messageData?: UpdateReservationMessageData
  ) => {
      try {
          const idToken = liff.getIDToken();
          if (!idToken) throw new Error('無法取得 ID token');
          
            await updateReserve(id, data, idToken);

          toast.success('預約更新成功！');
          
          if (messageData) {
             await sendUpdateLineMessage(messageData);
          }

            await mutate();
      } catch (err) {
          toast.error(err instanceof Error ? err.message : '更新失敗');
          throw err; 
      }
  }, [mutate, sendUpdateLineMessage]);

  const { upcomingReservations, pastReservations } = useMemo(() => {
    const now = new Date();
    const upcoming: ReserveWithServices[] = [];
    const past: ReserveWithServices[] = [];

    reservations.forEach((reserve) => {
      const statusKey = getReserveStatusKey(reserve, now);
      if (statusKey === 'upcoming') {
        upcoming.push(reserve);
      } else {
        past.push(reserve);
      }
    });

    return { upcomingReservations: upcoming, pastReservations: past };
  }, [reservations]);

  const detailStatus = useMemo(() => {
    if (!detailReserve) return null;
    const now = new Date();
    const statusKey = getReserveStatusKey(detailReserve, now);
    const statusText = STATUS_LABELS[statusKey];
    const statusClass = statusKey === 'upcoming'
      ? 'text-emerald-600'
      : statusKey === 'cancelled'
        ? 'text-red-500'
        : 'text-neutral-500';
    return { statusKey, statusText, statusClass, now };
  }, [detailReserve]);

  const detailDateValue = detailReserve?.date ? new Date(detailReserve.date) : null;
  const detailMonthText = detailDateValue ? format(detailDateValue, 'M月') : '—';
  const detailDayText = detailDateValue ? format(detailDateValue, 'd') : '—';
  const detailWeekday = detailDateValue
    ? WEEKDAYS[detailDateValue.getDay()]
    : detailReserve
      ? WEEKDAYS[detailReserve.timeSlot?.dayOfWeek ?? 0]
      : '';
  const detailTime = detailReserve?.timeSlot?.startTime ?? '00:00';
  const detailServiceNames = detailReserve?.services.map((item) => item.service.name) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-6">
        <div className="mx-auto max-w-md space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-6">
        <div className="mx-auto max-w-md">
          <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>發生錯誤</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : '發生未知錯誤。'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 px-5 pt-6">
      <div className="mx-auto max-w-md">
      {reservations.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-[0_6px_16px_rgba(15,15,15,0.04)]">
          <p className="text-sm text-neutral-500">您目前沒有任何預約紀錄。</p>
          <Button asChild className="mt-6">
            <Link href="/">
              <PlusCircle className="mr-2 h-4 w-4" />
              立即預約
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingReservations.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-600">即將到來</h2>
              <div className="space-y-3">
                {upcomingReservations.map((reserve) => (
                  <ReservationCard
                    key={reserve.id}
                    reserve={reserve}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </div>
            </section>
          )}
          {pastReservations.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-600">過去紀錄</h2>
              <div className="space-y-3">
                {pastReservations.map((reserve) => (
                  <ReservationCard
                    key={reserve.id}
                    reserve={reserve}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ResponsiveDialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          setIsDetailDialogOpen(open);
          if (!open) setDetailReserve(null);
        }}
        title="預約詳情"
      >
        {detailReserve && detailStatus && (
          <div className="space-y-5 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <span className={cn('flex items-center gap-2', detailStatus.statusClass)}>
                <span className="h-2 w-2 rounded-full bg-current" />
                {detailStatus.statusText}
              </span>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-neutral-50 px-4 py-3">
              <div className="flex h-[56px] w-[56px] flex-col items-center justify-center rounded-2xl bg-neutral-900 text-white">
                <span className="text-xs font-medium opacity-80">{detailMonthText}</span>
                <span className="text-xl font-semibold leading-none">{detailDayText}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  {detailDateValue ? format(detailDateValue, 'yyyy年M月d日') : '未指定日期'} {detailWeekday}
                </div>
                <div className="text-sm text-neutral-500">{detailTime}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-neutral-700">預約項目</div>
              <div className="flex flex-wrap gap-2">
                {detailServiceNames.length > 0 ? (
                  detailServiceNames.map((name) => (
                    <span key={name} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-neutral-400">未指定服務</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                到府牽車
              </span>
              <span className="font-semibold text-neutral-900">{detailReserve.isPickup ? '是' : '否'}</span>
            </div>

            {detailStatus.statusKey === 'upcoming' && detailReserve.status === 'PENDING' && (
              <div className="flex gap-2 sm:gap-3 pt-2">
                <Button variant="outline" className="flex-1 px-2 sm:px-4" onClick={() => handleEditClick(detailReserve)}>
                  <Pencil className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">修改預約</span>
                  <span className="sm:hidden">修改</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 px-2 sm:px-4 text-red-500 hover:text-red-600"
                  onClick={() => handleCancelClick(detailReserve)}
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">取消預約</span>
                  <span className="sm:hidden">取消</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </ResponsiveDialog>

      <ResponsiveDialog
        open={isCancelDialogOpen}
        onOpenChange={(open) => {
          setIsCancelDialogOpen(open);
          if (!open) setCancelTarget(null);
        }}
        title="取消預約"
      >
        <div className="space-y-4 py-4">
          <div className="flex gap-2 pt-4">
            <Button variant="destructive" onClick={handleCancelReservation} className="flex-1" disabled={!cancelTarget || isCancelling}>
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認取消
            </Button>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isCancelling}>
              返回
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      {editingReserve && (
        <EditReservationDialog 
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            reserve={editingReserve}
            onUpdate={handleUpdateReservation}
        />
      )}
      </div>
    </div>
  );
}

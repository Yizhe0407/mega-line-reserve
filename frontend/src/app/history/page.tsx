'use client';
import { useState, useEffect } from 'react';
import liff from '@line/liff';
import { useStepStore } from '@/store/step-store';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { History, PlusCircle, AlertCircle, Trash2, Calendar, Wrench, CheckCircle, Clock, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { Reserve, Service, UpdateReserveDTO } from '@/types';
import EditReservationDialog from '@/components/EditReservationDialog';
import { toast } from 'react-hot-toast';
import { useLiffMessage } from '@/hooks/useLiffMessage';
import { format } from 'date-fns';

interface ReserveServiceItem {
  service: Service;
}

interface ReserveWithServices extends Reserve {
  services: ReserveServiceItem[];
}

interface ReservationCardProps {
  reserve: ReserveWithServices;
  onCancel: (reserveId: number) => void;
  onEdit: (reserve: ReserveWithServices) => void;
}

interface UpdateReservationMessageData {
  date: string;
  time: string;
  license: string;
  serviceNames: string[];
  isPickup: boolean;
}

const ReservationCard = ({ reserve, onCancel, onEdit }: ReservationCardProps) => {
  const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const dayOfWeek = reserve.timeSlot?.dayOfWeek ?? 0;
  const startTime = reserve.timeSlot?.startTime ?? '00:00';
  const weekdayName = WEEKDAYS[dayOfWeek];
  
  /* 判斷是否過期邏輯 */
  // now: 當前時間
  // reserveTime: 預約時間 (日期 + 時段開始時間)
  const now = new Date();
  
  // 建立預約日期物件 (假設 reserve.date 為 YYYY-MM-DD 或 ISO)
  // 如果沒有 date (舊資料)，暫時視為不過期，或依賴 weekday 計算 (較複雜故暫略)
  const reserveDate = reserve.date ? new Date(reserve.date) : new Date();
  
  // 設定時段時間
  const [hours, minutes] = startTime.split(':').map(Number);
  reserveDate.setHours(hours, minutes, 0, 0);

  // 比較
  // 如果是舊資料(沒date)，這邏輯可能會判斷錯誤，但新預約都有 date
  // 若 reserve.date 是 '2025-01-01'，new Date() 會是該日 00:00 (UTC) 或 08:00 (TW) 取決於實作
  // 這裡假設 reserve.date 雖然是 string，但 new Date(reserve.date) 在本地瀏覽器會解讀正確日期
  // 安全起見，建議用 date-fns parse 或手動拆解
  // 這裡簡單做：僅當 reserve.date 存在時才嚴格判斷
  const isPast = reserve.date ? now > reserveDate : false;
  
  // 狀態已完成或已取消也視為不可編輯
  const isEditable = !isPast && reserve.status !== 'CANCELLED' && reserve.status !== 'COMPLETED';

  const status = reserve.status === 'COMPLETED' || reserve.status === 'CANCELLED' ? '已完成' : isPast ? '已過期' : '即將到來';
  const statusConfig = {
    '即將到來': {
      icon: <Clock className="h-4 w-4 mr-1.5" />,
      variant: 'default',
      className: 'bg-blue-500 text-white',
    },
    '已完成': {
      icon: <CheckCircle className="h-4 w-4 mr-1.5" />,
      variant: 'secondary',
      className: 'bg-gray-500 text-white',
    },
    '已過期': {
       icon: <AlertCircle className="h-4 w-4 mr-1.5" />,
       variant: 'secondary',
       className: 'bg-gray-400 text-white',
    }
  } as const;
  const currentStatus = statusConfig[status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="mr-2" />
            {reserve.date ? format(new Date(reserve.date), 'yyyy-M-d') : weekdayName} {startTime}
          </CardTitle>
          <Badge variant={currentStatus.variant} className={cn('flex items-center', currentStatus.className)}>
            {currentStatus.icon}
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center"><Wrench className="mr-2" />預約項目</h3>
          <ul className="list-disc list-inside pl-4 text-muted-foreground space-y-1">
            {reserve.services.map(item => (
              <li key={item.service.id}>{item.service.name}</li>
            ))}
          </ul>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold">到府牽車</span>
            <Badge variant={reserve.isPickup ? 'default' : 'secondary'}>
              {reserve.isPickup ? '是' : '否'}
            </Badge>
          </div>
        </div>
      </CardContent>
      {reserve.status === 'PENDING' && (
      <CardFooter className="flex justify-between">
          {!isPast ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(reserve)}>
                <Pencil className="mr-2 h-4 w-4" />
                修改
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onCancel(reserve.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                取消預約
              </Button>
            </>
          ) : (
             <div className="text-sm text-muted-foreground w-full text-right">
                預約已過期
             </div>
          )}
      </CardFooter>
      )}
    </Card>
  );
};

export default function RecordPage() {
  const [reservations, setReservations] = useState<ReserveWithServices[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, setServices } = useStepStore();
  const { sendUpdateLineMessage } = useLiffMessage();

  // Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReserve, setEditingReserve] = useState<ReserveWithServices | null>(null);

  useEffect(() => {
    const loadServices = async () => {
        try {
            const res = await fetch('/api/service');
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch(e) { console.error(e); }
    };
    loadServices();
  }, [setServices]);

  const fetchReservations = async () => {
    try {
        const idToken = liff.getIDToken();
        if (!idToken) throw new Error('無法取得 ID token。');
        
        const response = await fetch(`/api/reserve`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (!response.ok) throw new Error('無法獲取預約紀錄。');

        const data = await response.json();
        const sortedData = data.sort(
          (a: ReserveWithServices, b: ReserveWithServices) => {
             if (a.date && b.date) {
               const dateA = new Date(a.date).getTime();
               const dateB = new Date(b.date).getTime();
               if (dateA !== dateB) {
                 return dateA - dateB; 
               }
             }
            return 0;
          },
        );
        setReservations(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [userId]);

  const handleCancelReservation = async (reserveId: number) => {
    if (!confirm('您確定要取消這次的預約嗎？')) return;

    try {
      const idToken = liff.getIDToken();
      if (!idToken) throw new Error('無法取得 ID token。');
      
      const response = await fetch(`/api/reserve/${reserveId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (!response.ok) throw new Error('取消預約失敗。');

      setReservations((prev) => prev.filter((r) => r.id !== reserveId));
      toast.success('預約已取消');
    } catch (err) {
      alert(err instanceof Error ? err.message : '發生未知錯誤。');
    }
  };

  const handleEditClick = (reserve: ReserveWithServices) => {
      setEditingReserve(reserve);
      setIsEditDialogOpen(true);
  };

  const handleUpdateReservation = async (
    id: number,
    data: UpdateReserveDTO,
    messageData?: UpdateReservationMessageData
  ) => {
      try {
          const idToken = liff.getIDToken();
          if (!idToken) throw new Error('無法取得 ID token');
          
          const response = await fetch(`/api/reserve/${id}`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}` 
              },
              body: JSON.stringify(data)
          });

          if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.message || '更新失敗');
          }

          toast.success('預約更新成功！');
          
          if (messageData) {
             await sendUpdateLineMessage(messageData);
          }

          fetchReservations();
      } catch (err) {
          toast.error(err instanceof Error ? err.message : '更新失敗');
          throw err; 
      }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-background pb-24 px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center"><History className="mr-2" />預約紀錄</h1>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-background pb-24 px-4 py-6 flex flex-col items-center justify-center">
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>發生錯誤</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pb-24 px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center"><History className="mr-2" />預約紀錄</h1>
      {reservations.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">您目前沒有任何預約紀錄。</p>
          <Button asChild>
            <Link href="/">
              <PlusCircle className="mr-2 h-4 w-4" />
              立即預約
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reserve) => (
            <ReservationCard 
                key={reserve.id} 
                reserve={reserve} 
                onCancel={handleCancelReservation} 
                onEdit={handleEditClick}
            />
          ))}
        </div>
      )}

      {editingReserve && (
        <EditReservationDialog 
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            reserve={editingReserve}
            onUpdate={handleUpdateReservation}
        />
      )}
    </div>
  );
}

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
import { History, PlusCircle, AlertCircle, Trash2, Calendar, Wrench, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const ReservationCard = ({ reserve, onCancel }) => {
  const reservationDate = new Date(reserve.reservationTime);
  const isPast = reservationDate < new Date();
  const status = isPast ? '已完成' : '已確認';
  const statusConfig = {
    '已確認': {
      icon: <Clock className="h-4 w-4 mr-1.5" />,
      variant: 'default',
      className: 'bg-blue-500 text-white',
    },
    '已完成': {
      icon: <CheckCircle className="h-4 w-4 mr-1.5" />,
      variant: 'secondary',
      className: 'bg-gray-500 text-white',
    },
  };
  const currentStatus = statusConfig[status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="mr-2" />
            {format(reservationDate, 'yyyy/MM/dd HH:mm')}
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
        </div>
      </CardContent>
      {!isPast && (
        <CardFooter className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onCancel(reserve.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            取消預約
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default function RecordPage() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useStepStore();

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const accessToken = liff.getAccessToken();
        if (!accessToken) {
          throw new Error('無法取得 access token。');
        }
        const response = await fetch(`/api/reserve`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('無法獲取預約紀錄。');
        }

        const data = await response.json();
        // Sort reservations by date in descending order
        const sortedData = data.sort((a, b) => new Date(b.reservationTime) - new Date(a.reservationTime));
        setReservations(sortedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [userId]);

  const handleCancelReservation = async (reserveId) => {
    if (!confirm('您確定要取消這次的預約嗎？')) {
      return;
    }

    try {
      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        throw new Error('無法取得 access token。');
      }
      const response = await fetch(`/api/reserve/${reserveId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('取消預約失敗。');
      }

      setReservations(reservations.filter(r => r.id !== reserveId));
    } catch (err) {
      alert(err.message);
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
            <ReservationCard key={reserve.id} reserve={reserve} onCancel={handleCancelReservation} />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { zhTW } from 'date-fns/locale';
import { format } from 'date-fns';
import { isPastTime } from '@/lib/handleTime';
import { getActiveTimeSlots } from '@/lib/api/endpoints/timeSlot';
import { useStepStore } from '@/store/step-store';
import type { Reserve, TimeSlot, Service, UpdateReserveDTO } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reserve: Reserve;
  onUpdate: (id: number, data: UpdateReserveDTO, messageData?: UpdateReservationMessageData) => Promise<void>;
}

interface ReserveServiceItem {
  service: Service;
}

interface ReserveWithServices extends Reserve {
  services?: ReserveServiceItem[];
}

interface UpdateReservationMessageData {
  date: string;
  time: string;
  license: string;
  serviceNames: string[];
  isPickup: boolean;
}

export default function EditReservationDialog({ isOpen, onClose, reserve, onUpdate }: EditReservationDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlotId, setTimeSlotId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [isPickup, setIsPickup] = useState(false);
  const [license, setLicense] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const services = useStepStore((state) => state.services);

  // Initialize input fields with reservation data
  useEffect(() => {
    if (reserve && isOpen) {
      if (reserve.date) {
        setDate(new Date(reserve.date));
      }

      setTimeSlotId(reserve.timeSlotId);
      setIsPickup(reserve.isPickup || false);
      setLicense(reserve.license || "");

      const serviceIds = (reserve as ReserveWithServices).services?.map((s) => s.service.id) || [];
      setSelectedServices(serviceIds);
    }
  }, [reserve, isOpen]);

  // Fetch time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const data = await getActiveTimeSlots();
        setTimeSlots(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch time slots", error);
        toast.error("無法載入時段資訊");
      } finally {
        setIsLoadingSlots(false);
      }
    };

    if (isOpen) {
      fetchTimeSlots();
    }
  }, [isOpen]);

  const filteredSlots = timeSlots.filter(slot => {
    if (!date) return false;
    return slot.dayOfWeek === date.getDay();
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    if (!date || !timeSlotId) {
      toast.error('請選擇日期與時間');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('請至少選擇一個服務項目');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: UpdateReserveDTO = {
        date: format(date, 'yyyy-MM-dd'),
        timeSlotId,
        serviceIds: selectedServices,
        isPickup,
        license: license.trim().toUpperCase(),
      };
      
      const selectedSlot = timeSlots.find(s => s.id === timeSlotId);
      const selectedServiceNames = services
          .filter(s => selectedServices.includes(s.id))
          .map(s => s.name);

        const messageData: UpdateReservationMessageData = {
          date: format(date, 'yyyy-MM-dd'),
          time: selectedSlot?.startTime || '',
          license: license.trim().toUpperCase(),
          serviceNames: selectedServiceNames,
          isPickup
      };

      await onUpdate(reserve.id, updateData, messageData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="修改預約"
      description="請選擇新的日期、時間或服務項目。"
    >
      <div className="space-y-5 py-2">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-neutral-700">車牌號碼</Label>
          <Input
            value={license}
            onChange={(e) => setLicense(e.target.value.toUpperCase())}
            placeholder="例如：ABC-1234"
            className="rounded-xl border-neutral-200"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-neutral-700">服務項目</Label>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceToggle(service.id)}
                  aria-pressed={isSelected}
                  className={
                    `rounded-full border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`
                  }
                >
                  {service.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-neutral-700">日期</Label>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-2 min-h-[380px]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setTimeSlotId(null);
              }}
              disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
              locale={zhTW}
              className="rounded-xl bg-transparent w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-neutral-700">到府牽車</Label>
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3">
            <Checkbox
              id="edit-pickup"
              checked={isPickup}
              onCheckedChange={(checked) => setIsPickup(checked as boolean)}
            />
            <Label htmlFor="edit-pickup" className="text-sm font-medium text-neutral-600">
              需要到府牽車
            </Label>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-neutral-700">時間</Label>
          {!date ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 py-6 text-center text-sm text-neutral-400">
              請先選擇日期
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {isLoadingSlots ? (
                <div className="col-span-3 flex justify-center py-4"><Loader2 className="animate-spin" /></div>
              ) : filteredSlots.length > 0 ? (
                filteredSlots.map(slot => {
                  const isFull = (slot._count?.reserves ?? 0) >= slot.capacity;
                  const isCurrentSlot = slot.id === reserve.timeSlotId && format(date, 'yyyy-MM-dd') === reserve.date;
                  const disableBtn = !isCurrentSlot && isFull; 
                  
                  return (
                    <Button
                      key={slot.id}
                      variant={timeSlotId === slot.id ? 'default' : 'outline'}
                      disabled={disableBtn || isPastTime(format(date, 'yyyy-MM-dd'), slot.startTime)}
                      onClick={() => setTimeSlotId(slot.id)}
                      className="h-9 rounded-full px-2 text-xs"
                    >
                      {slot.startTime} {disableBtn && '(滿)'}
                    </Button>
                  )
                })
              ) : (
                <div className="col-span-3 rounded-2xl border border-dashed border-neutral-200 py-4 text-center text-sm text-neutral-400">
                  此日無時段
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
          取消
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          儲存變更
        </Button>
      </div>
    </ResponsiveDialog>
  );
}

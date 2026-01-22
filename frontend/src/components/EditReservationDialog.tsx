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
      };
      
      const selectedSlot = timeSlots.find(s => s.id === timeSlotId);
      const selectedServiceNames = services
          .filter(s => selectedServices.includes(s.id))
          .map(s => s.name);

        const messageData: UpdateReservationMessageData = {
          date: format(date, 'yyyy-MM-dd'),
          time: selectedSlot?.startTime || '',
          license: reserve.license,
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
        <div className="space-y-6 py-4">
          {/* Services Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">服務項目</Label>
            <div className="grid grid-cols-2 gap-3">
              {services.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceToggle(service.id)}
                    aria-pressed={isSelected}
                    className={
                      `w-full cursor-pointer rounded-lg border p-4 text-center transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-muted hover:bg-muted/50"
                      }`
                    }
                  >
                    <span className="text-sm font-medium">{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
             <Label className="text-base font-semibold">日期</Label>
             <div className="flex justify-center border rounded-md p-2">
               <Calendar
                 mode="single"
                 selected={date}
                 onSelect={(d) => {
                   setDate(d);
                   setTimeSlotId(null); // Reset time if date changes
                 }}
                 disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                 locale={zhTW}
                 className="rounded-md"
               />
             </div>
          </div>

           {/* Pickup Service Selection */}
           <div className="space-y-3">
             <div className="flex items-center space-x-2 border rounded-lg p-4">
               <Checkbox 
                 id="edit-pickup" 
                 checked={isPickup}
                 onCheckedChange={(checked) => setIsPickup(checked as boolean)}
               />
               <div className="grid gap-1.5 leading-none">
                 <Label htmlFor="edit-pickup" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                   需要到府牽車
                 </Label>
               </div>
             </div>
           </div>

           {/* Time Selection */}
           <div className="space-y-3">
             <Label className="text-base font-semibold">時間</Label>
             {!date ? (
               <div className="text-sm text-muted-foreground text-center py-4">請先選擇日期</div>
             ) : (
                <div className="grid grid-cols-3 gap-2">
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
                          className="h-9 px-2 text-xs"
                        >
                          {slot.startTime} {disableBtn && '(滿)'}
                        </Button>
                      )
                    })
                  ) : (
                    <div className="col-span-3 text-sm text-center py-2">此日無時段</div>
                  )}
                </div>
             )}
           </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>取消</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            儲存變更
          </Button>
        </div>
    </ResponsiveDialog>
  );
}

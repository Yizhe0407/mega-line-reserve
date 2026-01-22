import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { TimeSlot } from "@/types/timeSlot";
import { TimeSlotCard } from "./TimeSlotCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface WeeklyCalendarViewProps {
  weekdays: string[];
  groupedSlots: Record<number, TimeSlot[]>;
  onAddSlot: (dayIndex: number) => void;
  onEditSlot: (slot: TimeSlot) => void;
  onCopyDay: (dayIndex: number) => void;
}

function DayColumn({
  day,
  index,
  slots,
  onAddSlot,
  onEditSlot,
  onCopyDay,
}: {
  day: string;
  index: number;
  slots: TimeSlot[];
  onAddSlot: (dayIndex: number) => void;
  onEditSlot: (slot: TimeSlot) => void;
  onCopyDay: (dayIndex: number) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)"); // sm breakpoint
  const [isOpen, setIsOpen] = useState(false);

  // 當切換到桌面版時，強制展開
  useEffect(() => {
    if (isDesktop) {
      setIsOpen(true);
    }
  }, [isDesktop]);

  const canToggle = !isDesktop;

  return (
    <div className="border rounded-lg flex flex-col bg-background">
      {/* 標題區 */}
      <div
        className={`p-3 text-center font-semibold border-b bg-muted/50 flex items-center justify-between xl:justify-center relative min-h-[48px] ${
          canToggle ? "cursor-pointer select-none hover:bg-muted/80 transition-colors" : ""
        }`}
        onClick={() => canToggle && setIsOpen(!isOpen)}
      >
        {canToggle && (
          <div className="absolute left-3 text-muted-foreground">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
        
        <span className="absolute left-1/2 -translate-x-1/2">{day}</span>
        
        {(slots.length > 0 || isOpen) && (
          <div className="absolute right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
            {slots.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onCopyDay(index)}
                title="複製此天的時段"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 內容區 */}
      {isOpen && (
        <div className="p-2 flex-1 flex flex-col gap-2 min-h-[100px] animate-in slide-in-from-top-2 duration-200">
          <div className="flex-1 space-y-2">
            {slots.length > 0 ? (
              slots.map((slot) => (
                <TimeSlotCard
                  key={slot.id}
                  slot={slot}
                  onClick={() => onEditSlot(slot)}
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                無設定時段
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-auto"
            onClick={() => onAddSlot(index)}
          >
            <Plus className="w-4 h-4 mr-2" />
            新增時段
          </Button>
        </div>
      )}
    </div>
  );
}

export function WeeklyCalendarView({
  weekdays,
  groupedSlots,
  onAddSlot,
  onEditSlot,
  onCopyDay,
}: WeeklyCalendarViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
      {weekdays.map((day, index) => (
        <DayColumn
          key={index}
          day={day}
          index={index}
          slots={groupedSlots[index] || []}
          onAddSlot={onAddSlot}
          onEditSlot={onEditSlot}
          onCopyDay={onCopyDay}
        />
      ))}
    </div>
  );
}

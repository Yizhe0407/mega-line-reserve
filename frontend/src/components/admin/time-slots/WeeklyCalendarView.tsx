import { Button } from "@/components/ui/button";
import { Copy, Plus } from "lucide-react";
import type { TimeSlot } from "@/types/timeSlot";
import { TimeSlotCard } from "./TimeSlotCard";

interface WeeklyCalendarViewProps {
  weekdays: string[];
  groupedSlots: Record<number, TimeSlot[]>;
  onAddSlot: (dayIndex: number) => void;
  onEditSlot: (slot: TimeSlot) => void;
  onCopyDay: (dayIndex: number) => void;
}

export function WeeklyCalendarView({
  weekdays,
  groupedSlots,
  onAddSlot,
  onEditSlot,
  onCopyDay,
}: WeeklyCalendarViewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 星期標題 */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {weekdays.map((day, index) => (
          <div
            key={index}
            className="p-2 text-center font-semibold border-r last:border-r-0 flex items-center justify-center gap-2"
          >
            <span>{day}</span>
            {(groupedSlots[index]?.length || 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onCopyDay(index)}
                title="複製此天的時段"
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* 時段內容 */}
      <div className="grid grid-cols-7">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
          const slots = groupedSlots[dayIndex] || [];
          return (
            <div
              key={dayIndex}
              className="border-r last:border-r-0 min-h-[400px] p-2 space-y-2 flex flex-col"
            >
              {/* 時段列表 */}
              <div className="flex-1 space-y-2">
                {slots.map((slot) => (
                  <TimeSlotCard
                    key={slot.id}
                    slot={slot}
                    onClick={() => onEditSlot(slot)}
                  />
                ))}
              </div>

              {/* 新增按鈕 */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onAddSlot(dayIndex)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

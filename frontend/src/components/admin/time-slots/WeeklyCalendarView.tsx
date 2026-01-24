import { useState } from "react";
import { Plus, Copy, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/types";

interface WeeklyCalendarViewProps {
  weekdays: string[];
  groupedSlots: Record<number, TimeSlot[]>;
  onAddSlot: (dayIndex: number) => void;
  onEditSlot: (slot: TimeSlot) => void;
  onCopyDay: (dayIndex: number) => void;
}

const DAY_SHORT = ["日", "一", "二", "三", "四", "五", "六"];

export function WeeklyCalendarView({
  weekdays,
  groupedSlots,
  onAddSlot,
  onEditSlot,
  onCopyDay,
}: WeeklyCalendarViewProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  return (
    <>
      {/* Mobile View - Modern Card Style */}
      <div className="lg:hidden space-y-3 pb-20">
        {weekdays.map((day, index) => {
          const slots = groupedSlots[index] || [];
          const activeSlots = slots.filter((s) => s.isActive);

          return (
            <div
              key={index}
              className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm"
            >
              {/* Day Header */}
              <button
                type="button"
                onClick={() => toggleDay(index)}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors",
                      expandedDay === index
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {DAY_SHORT[index]}
                  </div>
                  <div className="text-left">
                    <span className="font-medium block">{day}</span>
                    <span className="text-xs text-muted-foreground">
                      {activeSlots.length > 0
                        ? `${activeSlots.length} 個可預約時段`
                        : "尚未設定"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyDay(index);
                    }}
                    className="p-2.5 hover:bg-muted rounded-xl transition-colors"
                    aria-label="複製時段"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      expandedDay === index && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {/* Expanded Content */}
              {expandedDay === index && (
                <div className="px-5 pb-5 pt-1 space-y-2 border-t border-border">
                  {slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      {slots.map((slot) => (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => onEditSlot(slot)}
                          className={cn(
                            "flex items-center justify-between px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]",
                            slot.isActive
                              ? "bg-muted hover:bg-muted/80"
                              : "bg-muted/50 text-muted-foreground line-through"
                          )}
                        >
                          <span className="font-semibold tabular-nums">
                            {slot.startTime}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {slot.capacity}人
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      尚無時段
                    </p>
                  )}

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => onAddSlot(index)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 mt-2 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-foreground hover:text-foreground transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">新增時段</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop View - Premium Week Grid */}
      <div className="hidden lg:grid grid-cols-7 gap-3">
        {weekdays.map((day, index) => {
          const slots = groupedSlots[index] || [];
          const activeSlots = slots.filter((s) => s.isActive);

          return (
            <div key={index} className="flex flex-col group">
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-200 flex items-center justify-center">
                    <span className="text-xs font-semibold">
                      {DAY_SHORT[index]}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium block">{day}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {activeSlots.length} 時段
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCopyDay(index)}
                  className="p-2 hover:bg-muted rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  aria-label="複製時段"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Time Slots Container */}
              <div className="flex-1 bg-card rounded-2xl border border-border p-3 min-h-[420px] flex flex-col shadow-sm">
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[500px] scrollbar-thin pr-1">
                  {slots.map((slot) => (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => onEditSlot(slot)}
                      className={cn(
                        "w-full text-left px-3 py-3 rounded-xl transition-all group/slot",
                        slot.isActive
                          ? "bg-muted hover:bg-muted/70 hover:shadow-sm"
                          : "bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold tabular-nums text-sm">
                          {slot.startTime}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] px-1.5 py-0.5 rounded-md transition-all",
                            slot.isActive
                              ? "bg-background text-muted-foreground"
                              : "text-muted-foreground/60"
                          )}
                        >
                          {slot.capacity}人
                        </span>
                      </div>
                    </button>
                  ))}

                  {slots.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-16 gap-2">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-xs">無時段</span>
                    </div>
                  )}
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => onAddSlot(index)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all border-2 border-dashed border-border hover:border-foreground/30"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">新增</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

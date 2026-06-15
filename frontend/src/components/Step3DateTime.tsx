"use client";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo } from "react";
import { isPastTime } from "@/lib/handleTime";
import StepButtonGroup from "./StepButtonGroup";
import { Button } from "@/components/ui/button";
import { useStepStore } from "@/store/step-store";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useAvailableTimeSlots } from "@/hooks/useAvailableTimeSlots";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Step3DateTime() {
  const step3Data = useStepStore((state) => state.step3Data);
  const setStep3Data = useStepStore((state) => state.setStep3Data);
  
  // 使用新的 Hook 根據選擇的日期取得可用時段與預約狀況
  const { timeSlots, isLoading } = useAvailableTimeSlots(step3Data.date || null);

  const filteredSlots = useMemo(() => {
    if (!step3Data.date || !timeSlots) return [];

    // 時段已經由後端根據日期過濾，這裡只需要排序與格式化
    return timeSlots
      .map((slot) => ({
        ...slot,
        date: step3Data.date,
        timeLabel: slot.startTime,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [step3Data.date, timeSlots]);

  const morningSlots = useMemo(
    () => filteredSlots.filter((slot) => Number(slot.startTime.split(":")[0]) < 12),
    [filteredSlots]
  );
  const afternoonSlots = useMemo(
    () => filteredSlots.filter((slot) => Number(slot.startTime.split(":")[0]) >= 12),
    [filteredSlots]
  );

  return (
    <>
      <div className="px-4 pt-24">
        <Card className="shadow-none border-none gap-4">
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border bg-secondary/50 p-2">
              <Calendar
                mode="single"
                locale={zhTW}
                selected={step3Data.date ? new Date(step3Data.date) : undefined}
                onSelect={(day) => {
                  setStep3Data({
                    date: day ? format(day, "yyyy-MM-dd") : "",
                    time: "", // 清除時間選擇
                    timeSlotId: null,
                  });
                }}
                disabled={(date) =>
                  date < new Date(new Date().toDateString()) ||
                  date.getDay() === 0
                }
                className="w-full bg-transparent rounded-xl"
              />
            </div>

            <Separator />

            {!step3Data.date ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">請先選擇預約日期</p>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm">正在查詢可預約時段...</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">當天沒有可預約時段</p>
              </div>
            ) : (
              <div className="space-y-5">
                {[
                  { label: "上午", slots: morningSlots },
                  { label: "下午", slots: afternoonSlots },
                ]
                  .filter((group) => group.slots.length > 0)
                  .map((group) => (
                    <div key={group.label} className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        {group.label}
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {group.slots.map((slot) => {
                          // _count.reserves 現在只會包含該日期的非取消預約
                          const reserveCount = slot._count?.reserves ?? 0;
                          const remaining = slot.capacity - reserveCount;
                          const isFull = remaining <= 0;
                          const isSelected = step3Data.timeSlotId === slot.id;
                          const isLow = !isFull && remaining <= 2;

                          let capacityClass = "text-muted-foreground";
                          if (isSelected) capacityClass = "text-primary-foreground/85";
                          else if (isFull) capacityClass = "text-destructive";
                          else if (isLow) capacityClass = "text-brand-strong";

                          return (
                            <Button
                              disabled={
                                !step3Data.date ||
                                isPastTime(step3Data.date, slot.timeLabel) ||
                                isFull
                              }
                              key={slot.id}
                              variant={isSelected ? "default" : "outline"}
                              onClick={() =>
                                setStep3Data({
                                  time: slot.timeLabel,
                                  timeSlotId: slot.id,
                                })
                              }
                              className="h-14 !flex-col gap-0.5 text-sm"
                            >
                              <span className="font-semibold text-[15px]">{slot.timeLabel}</span>
                              {(isFull || slot.capacity > 1) && (
                                <span className={cn("text-[10px] leading-none", capacityClass)}>
                                  {isFull ? "額滿" : `剩 ${remaining} 位`}
                                </span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup
        isNextDisabled={!step3Data.date || !step3Data.timeSlotId}
      />
    </>
  );
}

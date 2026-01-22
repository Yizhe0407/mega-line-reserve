'use client'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale';
import { useState, useEffect, useMemo } from "react"
import { isPastTime } from "@/lib/handleTime"
import { getActiveTimeSlots } from "@/lib/api/endpoints/timeSlot"
import StepButtonGroup from "./StepButtonGroup"
import { Button } from "@/components/ui/button"
import { useStepStore } from "@/store/step-store"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TimeSlot } from "@/types"

export default function Step3DateTime() {
  const step3Data = useStepStore((state) => state.step3Data)
  const setStep3Data = useStepStore((state) => state.setStep3Data)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const getTimeSlots = async () => {
      try {
        const data = await getActiveTimeSlots();
        // 確保回傳的是陣列
        setTimeSlots(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching time slots:", error)
        setTimeSlots([]); // 發生錯誤時設為空陣列
      }
    }
    getTimeSlots()
  }, [])

  const filteredSlots = useMemo(() => {
    if (!step3Data.date) return [];
    
    // 計算選擇日期是星期幾 (0=週日, 1=週一, ..., 6=週六)
    const selectedDate = new Date(step3Data.date);
    const dayOfWeek = selectedDate.getDay();
    
    // 篩選該星期的時段
    return timeSlots
      .filter((slot) => slot.dayOfWeek === dayOfWeek)
      .map((slot) => ({
        ...slot,
        date: step3Data.date,
        timeLabel: slot.startTime,
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [step3Data.date, timeSlots]);

  return (
    <>
      <div className="px-4 pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">選擇日期與時間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center pb-8">
              <Calendar
                mode="single"
                locale={zhTW}
                selected={step3Data.date ? new Date(step3Data.date) : undefined}
                onSelect={(day) => {
                  setStep3Data({
                    date: day ? format(day, 'yyyy-MM-dd') : "",
                    time: "", // 清除時間選擇
                    timeSlotId: null,
                  })
                }}
                disabled={(date) => date < new Date(new Date().toDateString()) || date.getDay() === 0}
                className="w-full max-w-md"
              />
            </div>

            <Separator />

            {!step3Data.date ? (
              <div className="text-center py-8 text-[#a3a3a3]">
                <p className="text-sm">請先選擇預約日期</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredSlots.map((slot) => {
                  const reserveCount = slot._count?.reserves ?? 0;
                  const isFull = reserveCount >= slot.capacity;
                  
                  return (
                    <Button
                      disabled={
                        !step3Data.date ||  // 尚未選擇日期時，按鈕不可點
                        isPastTime(step3Data.date, slot.timeLabel) ||  // 如果選的是今天，且這個時段已經過了，不可點
                        isFull  // 時段已額滿
                      }
                      key={slot.id}
                      variant={step3Data.timeSlotId === slot.id ? "default" : "outline"}
                      onClick={() =>
                        setStep3Data({
                          time: slot.timeLabel,
                          timeSlotId: slot.id,
                        })
                      }
                      className="h-12 text-sm"
                    >
                      {slot.timeLabel}
                      {isFull && <span className="ml-1 text-xs">(額滿)</span>}
                    </Button>
                  );
                })}
                {filteredSlots.length === 0 && (
                  <div className="col-span-3 text-center py-6 text-[#a3a3a3]">
                    <p className="text-sm">當天沒有可預約時段</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup
        isNextDisabled={!step3Data.date || !step3Data.timeSlotId}
      />
    </>
  )
}

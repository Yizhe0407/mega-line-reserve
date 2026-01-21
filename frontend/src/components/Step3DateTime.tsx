'use client'
import liff from "@line/liff";
import { format } from 'date-fns'
import ProgressBar from "./ProgressBar";
import { zhTW } from 'date-fns/locale';
import { useState, useEffect } from "react"
import { isPastTime } from "@/lib/handleTime"
import StepButtonGroup from "./StepButtonGroup"
import { Button } from "@/components/ui/button"
import { useStepStore } from "@/store/step-store"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Step3DateTime() {
  const step3Data = useStepStore((state) => state.step3Data)
  const setStep3Data = useStepStore((state) => state.setStep3Data)
  const [existTime, setExistTime] = useState([]);

  const TIME_SLOTS = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "14:00", "15:00"]

  useEffect(() => {
    const getTime = async () => {
      try {
        const idToken = liff.getIDToken();
        const response = await fetch('/api/reserve/not-available-time',{
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        const data = await response.json();
        const time = data.map(item => {
            const d = new Date(item.reservationTime);
            return [format(d, 'yyyy-MM-dd'), format(d, 'HH:mm')];
        });
        setExistTime(time);
      } catch (error) {
        console.error("Error fetching time slots:", error)
      }
    }
    getTime()
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24">
      <ProgressBar />

      <div className="px-4 pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">選擇日期與時間</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                locale={zhTW}
                selected={step3Data.date ? new Date(step3Data.date) : undefined}
                onSelect={(day) => {
                  setStep3Data({
                    date: day ? format(day, 'yyyy-MM-dd') : "",
                    time: "", // 清除時間選擇
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
                {TIME_SLOTS.map((time) => (
                  <Button
                    disabled={
                      !step3Data.date ||  // 尚未選擇日期時，按鈕不可點
                      existTime.some(([date, t]) => date === step3Data.date && t === time) || // 如果這個時段已經被預約，不可點
                      isPastTime(step3Data.date, time)  // 如果選的是今天，且這個時段已經過了，不可點
                    }
                    key={time}
                    variant={step3Data.time === time ? "default" : "outline"}
                    onClick={() =>
                      setStep3Data({
                        time,
                      })
                    }
                    className="h-12 text-sm"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup
        isNextDisabled={!step3Data.date || !step3Data.time}
      />
    </div>
  )
}

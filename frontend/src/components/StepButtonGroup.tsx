"use client";
import liff from "@line/liff";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStepStore } from "@/store/step-store";
import { useLiffMessage } from "@/hooks/useLiffMessage";
import { format } from "date-fns";

export default function StepButtonGroup({
  isLoading = false,
  isNextDisabled = false,
}) {
  const currentStep = useStepStore((step) => step.currentStep);
  const prevStep = useStepStore((step) => step.prevStep);
  const nextStep = useStepStore((step) => step.nextStep);
  const reset = useStepStore((step) => step.reset);
  const FIRST_STEP = 1;
  const TOTAL_STEP = 4;
  const router = useRouter();
  const step1Data = useStepStore((state) => state.step1Data);
  const step2Data = useStepStore((state) => state.step2Data);
  const step3Data = useStepStore((state) => state.step3Data);

  // 第一頁時「上一步」禁用，否則啟用
  const isPreviousDisabled = currentStep === FIRST_STEP;

  // 第四頁時「下一步」顯示「確認預約」，否則顯示「下一步」
  const nextButtonText = currentStep === TOTAL_STEP ? "確認預約" : "下一步";

  const send = async () => {
    const { date, time } = step3Data;
    const dateString = typeof date === 'string' ? date : (date ? format(date, 'yyyy-MM-dd') : '');
    const reservationTime = new Date(`${dateString}T${time}:00`);

    const serviceIds = step2Data.selectServe;

    const reserveData = {
      serviceIds,
      reservationTime: reservationTime.toISOString(),
      otherService: step2Data.isOtherServiceSelected ? step2Data.otherService : null,
    };
    console.log(step3Data)
    console.log(reservationTime)
    console.log(reserveData)
    try {
      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        throw new Error("無法取得 access token");
      }
      await fetch("/api/reserve", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(reserveData),
      });
    } catch (error) {
      console.error("Error during send:", error);
    }
  };
  const { sendLineMessage } = useLiffMessage(); //不能放在handleNextClick內，React Hook只能在組件的最外層呼叫
  const handleNextClick = async () => {
    if (currentStep === TOTAL_STEP) {
      await toast.promise(
        (async () => {
          await send();
          await sendLineMessage();
          reset();
        })(),
        {
          loading: "處理中...",
          success: "預約完成！",
          error: "預約失敗，請稍後再試",
        }
      );
      router.push("/final");
    } else {
      nextStep();
    }
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 p-4 bg-background">
      <div className="flex gap-3 max-w-md mx-auto">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={isPreviousDisabled}
          className="flex-1 h-12 "
        >
          上一步
        </Button>
        <Button
          onClick={handleNextClick}
          disabled={isNextDisabled || isLoading}
          className="flex-1 h-12 "
        >
          {isLoading ? "處理中..." : nextButtonText}
        </Button>
      </div>
    </div>
  );
}

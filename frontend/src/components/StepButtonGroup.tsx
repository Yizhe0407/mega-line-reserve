"use client";
import liff from "@line/liff";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStepStore } from "@/store/step-store";
import { useShallow } from "zustand/react/shallow";
import { useLiffMessage } from "@/hooks/useLiffMessage";
import { createReserve } from "@/lib/api/endpoints/reserve";
import { useSWRConfig } from "swr";
import { Loader2 } from "lucide-react";

export default function StepButtonGroup({
  isLoading = false,
  isNextDisabled = false,
}) {
  const {
    currentStep,
    prevStep,
    nextStep,
    reset,
    step1Data,
    step2Data,
    step3Data,
  } = useStepStore(
    useShallow((state) => ({
    currentStep: state.currentStep,
    prevStep: state.prevStep,
    nextStep: state.nextStep,
    reset: state.reset,
    step1Data: state.step1Data,
    step2Data: state.step2Data,
    step3Data: state.step3Data,
    }))
  );
  const FIRST_STEP = 1;
  const TOTAL_STEP = 4;
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 第一頁時「上一步」禁用，否則啟用
  const isPreviousDisabled = currentStep === FIRST_STEP;

  // 第四頁時「下一步」顯示「確認預約」，否則顯示「下一步」
  const nextButtonText = currentStep === TOTAL_STEP ? "確認預約" : "下一步";

  const send = async () => {
    const serviceIds = step2Data.selectServe;

    const reserveData = {
      serviceIds,
      timeSlotId: step3Data.timeSlotId!,
      license: step1Data.license!,
      userMemo: step2Data.isOtherServiceSelected ? step2Data.otherService : undefined,
      date: step3Data.date!,
      isPickup: step2Data.extra,
    };
    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }
      await createReserve(reserveData, idToken);
      await mutate((key) => Array.isArray(key) && key[0] === "reserves");
    } catch (error) {
      console.error("Error during send:", error);
    }
  };
  const { sendLineMessage } = useLiffMessage();
  const handleNextClick = async () => {
    if (currentStep === TOTAL_STEP) {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            await send();
            await sendLineMessage();
            // 成功後先不 reset()，避免 currentStep 變回 1 導致按鈕文字閃爍
          })(),
          {
            loading: "處理中…",
            success: "預約完成！",
            error: "預約失敗，請稍後再試",
          }
        );
        router.push("/final");
        setTimeout(() => reset(), 500); 
      } catch (error) {
        setIsSubmitting(false);
      }
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
          disabled={isNextDisabled || isLoading || isSubmitting}
          className="flex-1 h-12 "
        >
          {isLoading || isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              處理中…
            </>
          ) : (
            nextButtonText
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";
import toast from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStepStore } from "@/store/step-store";
import { useShallow } from "zustand/react/shallow";
import { useReservationSubmit } from "@/hooks/useReservationSubmit";
import { Loader2 } from "lucide-react";

export default function StepButtonGroup({
  isLoading = false,
  isNextDisabled = false,
}) {
  const { currentStep, prevStep, nextStep, reset } = useStepStore(
    useShallow((state) => ({
      currentStep: state.currentStep,
      prevStep: state.prevStep,
      nextStep: state.nextStep,
      reset: state.reset,
    }))
  );
  const FIRST_STEP = 1;
  const TOTAL_STEP = 4;
  const router = useRouter();
  const { submitReservation } = useReservationSubmit();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 第一頁時「上一步」禁用，否則啟用
  const isPreviousDisabled = currentStep === FIRST_STEP;

  // 第四頁時「下一步」顯示「確認預約」，否則顯示「下一步」
  const nextButtonText = currentStep === TOTAL_STEP ? "確認預約" : "下一步";

  const handleNextClick = async () => {
    if (currentStep === TOTAL_STEP) {
      setIsSubmitting(true);
      try {
        // 成功後先不 reset()，避免 currentStep 變回 1 導致按鈕文字閃爍
        await toast.promise(submitReservation(), {
          loading: "處理中…",
          success: "預約完成！",
          error: (err) => (err instanceof Error ? err.message : "預約失敗，請稍後再試"),
        });
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
    <div className="fixed bottom-16 left-0 right-0 px-4 pt-3.5 pb-4 bg-background rounded-t-2xl shadow-[0_-4px_12px_-4px_rgba(38,32,25,0.06)] z-20">
      <div className="flex gap-3 max-w-md mx-auto">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={isPreviousDisabled}
          className="w-28 shrink-0 h-12"
        >
          上一步
        </Button>
        <Button
          onClick={handleNextClick}
          disabled={isNextDisabled || isLoading || isSubmitting}
          className="flex-1 h-12 text-base font-bold"
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

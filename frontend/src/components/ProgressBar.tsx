import * as React from "react";
import { cn } from "@/lib/utils";
import { useStepStore } from "@/store/step-store";

const STEP_TITLES = ["基本資料", "預約項目", "選擇日期與時間", "確認預約資訊"];

export default function ProgressBar() {
  const currentStep = useStepStore((state) => state.currentStep);
  const TOTAL_STEP = 4;
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 max-w-md px-5 pt-4 pb-3 z-20 mx-auto w-full bg-background/95 backdrop-blur-md">
      <h1 className="text-xl font-bold tracking-tight leading-tight mb-3">
        {STEP_TITLES[currentStep - 1]}
      </h1>
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEP }, (_, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber <= currentStep;

          return (
            <div
              key={stepNumber}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                isDone ? "bg-primary" : "bg-border"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

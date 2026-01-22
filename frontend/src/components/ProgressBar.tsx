import * as React from "react";
import { cn } from "@/lib/utils";
import { useStepStore } from "@/store/step-store";

export default function ProgressBar() {
  const currentStep = useStepStore((state) => state.currentStep);
  const TOTAL_STEP = 4;
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 max-w-md px-4 py-4 z-10 mx-auto w-full bg-background">
      <div className="flex items-center">
        {Array.from({ length: TOTAL_STEP }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors shrink-0",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {stepNumber}
              </div>
              {index < TOTAL_STEP - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    stepNumber < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

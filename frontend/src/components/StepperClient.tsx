"use client";
import dynamic from "next/dynamic";
import { useStepStore } from "@/store/step-store";
import Step1UserInfo from "@/components/Step1UserInfo";
import ProgressBar from "@/components/ProgressBar";

const Step2ServiceSelect = dynamic(() => import("@/components/Step2ServiceSelect"), {
  loading: () => (
    <div className="px-4 pt-20">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="h-5 w-32 rounded-md bg-muted animate-pulse" />
        <div className="mt-6 space-y-3">
          <div className="h-12 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-12 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-12 w-full rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  ),
});
const Step3DateTime = dynamic(() => import("@/components/Step3DateTime"), {
  loading: () => (
    <div className="px-4 pt-20">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
        <div className="mt-6 h-64 w-full rounded-lg bg-muted animate-pulse" />
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="h-12 rounded-md bg-muted animate-pulse" />
          <div className="h-12 rounded-md bg-muted animate-pulse" />
          <div className="h-12 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  ),
});
const Step4Confirm = dynamic(() => import("@/components/Step4Confirm"), {
  loading: () => (
    <div className="px-4 pt-20">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
        <div className="mt-6 space-y-4">
          <div className="h-16 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-16 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-16 w-full rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  ),
});

import { useStepServices } from "@/hooks/useStepServices";
import { useActiveTimeSlots } from "@/hooks/useActiveTimeSlots";

export default function StepperClient() {
  const currentStep = useStepStore((step) => step.currentStep);
  
  // 預先載入資料 (Prefetching)
  useStepServices();
  useActiveTimeSlots();
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1UserInfo />;
      case 2:
        return <Step2ServiceSelect />;
      case 3:
        return <Step3DateTime />;
      case 4:
        return <Step4Confirm />;
      default:
        return <Step1UserInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <ProgressBar />
      {renderStep()}
    </div>
  );
}

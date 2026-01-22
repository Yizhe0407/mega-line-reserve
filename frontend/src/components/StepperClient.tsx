"use client";
import { useStepStore } from "@/store/step-store";
import Step1UserInfo from "@/components/Step1UserInfo";
import Step2ServiceSelect from "@/components/Step2ServiceSelect";
import Step3DateTime from "@/components/Step3DateTime";
import Step4Confirm from "@/components/Step4Confirm";
import ProgressBar from "@/components/ProgressBar";

export default function StepperClient() {
  const currentStep = useStepStore((step) => step.currentStep);
  
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

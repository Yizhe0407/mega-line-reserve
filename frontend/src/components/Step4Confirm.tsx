import { useMemo } from "react";
import { useStepStore } from "@/store/step-store"
import StepButtonGroup from "./StepButtonGroup";
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import type { Service } from "@/types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-bold text-sm mb-3">
      <span className="h-3.5 w-[3px] rounded-full bg-brand" />
      {children}
    </div>
  );
}

export default function Step4Confirm() {
  const step1Data = useStepStore((state) => state.step1Data)
  const step2Data = useStepStore((state) => state.step2Data)
  const step3Data = useStepStore((state) => state.step3Data)
  const services = useStepStore((state) => state.services)

  const serviceMap = useMemo(() => {
    return new Map(services.map((service) => [service.id, service]));
  }, [services]);

  const selectedServices = useMemo<Service[]>(() => {
    if (services.length === 0) return [];
    return (step2Data.selectServe || [])
      .map((id) => serviceMap.get(id))
      .filter((service): service is Service => Boolean(service));
  }, [step2Data.selectServe, serviceMap, services.length]);

  return (
    <>
      <div className="px-4 pt-24">
        <Card className="shadow-none border-none gap-4">
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <SectionTitle>基本資料</SectionTitle>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">手機號碼</span>
                    <span className="text-sm font-bold">{step1Data.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">車牌號碼</span>
                    <span className="text-sm font-bold">{step1Data.license}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <SectionTitle>服務項目</SectionTitle>
                <div className="space-y-2">
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">選擇項目</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map(service => (
                        <span
                          key={service.id}
                          className="rounded-lg border border-border bg-transparent px-2.5 py-1 text-xs text-secondary-foreground"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {step2Data.isOtherServiceSelected && step2Data.otherService && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">其他服務</span>
                      <span className="text-sm font-bold">{step2Data.otherService}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">到府牽車</span>
                    <span className="text-sm font-bold">{step2Data.extra ? "是" : "否"}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <SectionTitle>預約時間</SectionTitle>
                <div className="rounded-2xl bg-brand-soft px-4 py-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-brand-strong/80">日期</span>
                    <span className="text-sm font-bold text-brand-strong">{step3Data.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-brand-strong/80">時間</span>
                    <span className="text-sm font-bold text-brand-strong">{step3Data.time}</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>請檢查預約資訊是否正確無誤。</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup isNextDisabled={!step3Data.date || !step3Data.timeSlotId} />
    </>
  )
}

import { useMemo } from "react";
import { useStepStore } from "@/store/step-store"
import StepButtonGroup from "./StepButtonGroup";
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Service } from "@/types";

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
      <div className="px-4 pt-20">
        <Card className="shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-center">確認預約資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm mb-2">基本資料</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">姓名</span>
                    <span className="text-sm font-bold">{step1Data.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">車牌號碼</span>
                    <span className="text-sm font-bold">{step1Data.license}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-bold text-sm mb-2">服務項目</h3>
                <div className="space-y-2">
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">選擇項目</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map(service => (
                        <Badge key={service.id} variant="secondary">
                          {service.name}
                        </Badge>
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
                <h3 className="font-bold text-sm mb-2">預約時間</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">日期</span>
                    <span className="text-sm font-bold">{step3Data.date}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">時間</span>
                    <span className="text-sm font-bold">{step3Data.time}</span>
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

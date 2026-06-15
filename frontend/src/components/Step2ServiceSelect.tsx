'use client'
import { useCallback, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useStepStore } from "@/store/step-store"
import { useStepServices } from "@/hooks/useStepServices"
import { Textarea } from "@/components/ui/textarea"
import StepButtonGroup from "./StepButtonGroup";
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Service } from "@/types"
import { Check } from "lucide-react"


export default function Step2ServiceSelect() {
  const step2Data = useStepStore((state) => state.step2Data)
  const setStep2Data = useStepStore((state) => state.setStep2Data)
  const { services, isLoading } = useStepServices()

  const otherServiceId = useMemo(() => {
    return services.find((s: Service) => s.name === '其他')?.id;
  }, [services]);

  const activeServices = useMemo(() => {
    return services.filter((service: Service) => service.isActive);
  }, [services]);

  const toggleService = useCallback((serviceId: number) => {
    const current = step2Data?.selectServe || []
    const newSelected = current.includes(serviceId)
      ? current.filter((id: number) => id !== serviceId)
      : [...current, serviceId]

    const isOtherSelected = otherServiceId ? newSelected.includes(otherServiceId) : false;

    setStep2Data({
      ...step2Data,
      selectServe: newSelected,
      isOtherServiceSelected: isOtherSelected,
    })
  }, [otherServiceId, setStep2Data, step2Data]);

  return (
    <>
      <div className="px-4 pt-24">
        <Card className="shadow-none border-none gap-4">
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-[3px] rounded-full bg-brand" />
                <p className="text-base font-bold tracking-tight">服務項目（可複選）</p>
              </div>
              <div className="grid gap-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : (
                  activeServices.map((service: Service) => {
                    const isSelected = step2Data?.selectServe?.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-[0.99]",
                          isSelected
                            ? "border-brand bg-brand-soft"
                            : "border-border bg-card hover:border-foreground/25"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border shrink-0 transition-colors",
                            isSelected
                              ? "border-brand bg-brand text-white"
                              : "border-border bg-transparent"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 flex flex-col">
                          <span className="font-medium text-base">{service.name}</span>
                          {(service.duration != null || service.price != null) && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {[
                                service.duration != null && `${service.duration} 分鐘`,
                                service.price != null && `NT$ ${service.price}`,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div
              className={cn(
                "space-y-2",
                !(otherServiceId ? step2Data?.selectServe?.includes(otherServiceId) : false) && "hidden"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-[3px] rounded-full bg-brand" />
                <Label htmlFor="other-service" className="text-base font-bold tracking-tight">
                  其他服務需求
                </Label>
              </div>
              <Textarea
                id="other-service"
                name="other-service"
                autoComplete="off"
                placeholder="請詳細說明您的服務需求…"
                className="min-h-[100px]"
                value={step2Data?.otherService || ""}
                onChange={e =>
                  setStep2Data({
                    ...step2Data,
                    otherService: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-[3px] rounded-full bg-brand" />
                <p className="text-base font-bold tracking-tight">額外服務</p>
              </div>
              <div
                role="checkbox"
                aria-checked={step2Data?.extra || false}
                tabIndex={0}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer bg-secondary/50 active:scale-[0.99] transition-all"
                onClick={() => setStep2Data({
                  ...step2Data,
                  extra: !step2Data?.extra,
                })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setStep2Data({
                      ...step2Data,
                      extra: !step2Data?.extra,
                    });
                  }
                }}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border shrink-0 transition-colors",
                    step2Data?.extra
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-transparent"
                  )}
                >
                  {step2Data?.extra && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </div>
                <span className="text-sm font-medium">
                  需要到府牽車
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup isNextDisabled={!step2Data?.selectServe || step2Data.selectServe.length === 0} />
    </>
  )
}

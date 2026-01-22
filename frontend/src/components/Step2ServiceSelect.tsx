'use client'
import { useCallback, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useStepStore } from "@/store/step-store"
import { useStepServices } from "@/hooks/useStepServices"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import StepButtonGroup from "./StepButtonGroup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Service } from "@/types"
import { Car } from "lucide-react"


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
      <div className="px-4 pt-20">
        <Card className="shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-center">預約項目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-md font-bold">服務項目（可複選）</p>
              <div className="grid gap-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : (
                  activeServices.map((service: Service) => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors",
                          step2Data?.selectServe?.includes(service.id)
                            ? "bg-black text-white"
                            : "bg-[#f8f8f8] hover:bg-gray-200"
                        )}
                      >
                        <span className="font-medium text-base">{service.name}</span>
                        <span className={cn(
                          "text-sm",
                          step2Data?.selectServe?.includes(service.id) ? "text-gray-300" : "text-gray-600"
                        )}>{service.duration}</span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div
              className={cn(
                "space-y-2",
                !(otherServiceId ? step2Data?.selectServe?.includes(otherServiceId) : false) && "hidden"
              )}
            >
              <Label htmlFor="other-service" className="text-md font-bold">
                其他服務需求
              </Label>
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
              <p className="text-md font-bold">額外服務</p>
              <div 
                className="flex items-center space-x-2 px-4 py-3 rounded-xl cursor-pointer" 
                style={{ backgroundColor: '#f8f8f8' }}
                onClick={() => setStep2Data({
                  ...step2Data,
                  extra: !step2Data?.extra,
                })}
              >
                <Checkbox
                  id="pickup"
                  checked={step2Data?.extra || false}
                  onCheckedChange={(checked) => {
                    setStep2Data({
                      ...step2Data,
                      extra: checked === true,
                    })
                  }}
                />
                <Car className="h-5 w-5 text-gray-600" />
                <Label htmlFor="pickup" className="text-sm font-normal cursor-pointer">
                  需要到府牽車
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup isNextDisabled={!step2Data?.selectServe || step2Data.selectServe.length === 0} />
    </>
  )
}

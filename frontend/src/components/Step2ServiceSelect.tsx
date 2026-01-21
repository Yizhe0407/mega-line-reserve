'use client'
import { useState, useEffect } from "react"
import ProgressBar from "./ProgressBar";
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
import type { Service } from "@/types/service"


export default function Step2ServiceSelect() {
  const [isLoading, setIsLoading] = useState(true)
  const step2Data = useStepStore((state) => state.step2Data)
  const setStep2Data = useStepStore((state) => state.setStep2Data)
  const { services, fetchServices } = useStepServices()

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true)
      await fetchServices()
      setIsLoading(false)
    }
    loadServices()
  }, [fetchServices])

  const toggleService = (serviceId: number) => {
    const current = step2Data?.selectServe || []
    const newSelected = current.includes(serviceId)
      ? current.filter((id: number) => id !== serviceId)
      : [...current, serviceId]

    const otherServiceId = services.find((s: Service) => s.name === '其他')?.id;
    const isOtherSelected = otherServiceId ? newSelected.includes(otherServiceId) : false;

    setStep2Data({
      ...step2Data,
      selectServe: newSelected,
      isOtherServiceSelected: isOtherSelected,
    })
  }

  const otherServiceId = services.find((s: Service) => s.name === '其他')?.id;

  return (
    <div className="min-h-screen bg-background pb-24">
      <ProgressBar />

      <div className="px-4 pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">預約項目</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-md font-bold">服務項目（可複選）</p>
              <div className="grid gap-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  services.map((service: Service) => (
                    <Button
                      key={service.id}
                      variant={step2Data?.selectServe?.includes(service.id) ? "default" : "outline"}
                      onClick={() => toggleService(service.id)}
                      className="h-12 justify-start"
                    >
                      {service.name}
                    </Button>
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
              <Textarea
                id="other-service"
                placeholder="請詳細說明您的服務需求..."
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
              <div className="flex items-center space-x-2">
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
                <Label htmlFor="pickup" className="text-sm font-normal">
                  需要到府牽車
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup isNextDisabled={!step2Data?.selectServe || step2Data.selectServe.length === 0} />
    </div>
  )
}

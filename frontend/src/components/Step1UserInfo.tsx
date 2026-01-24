import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStepStore } from "@/store/step-store";
import { useStepUserData } from "@/hooks/useStepUserData";
import StepButtonGroup from "./StepButtonGroup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Step1UserInfo() {
  const step1Data = useStepStore((state) => state.step1Data);
  const setStep1Data = useStepStore((state) => state.setStep1Data);
  const isLoading = useStepStore((state) => state.isLoading);
  const { fetchUserData } = useStepUserData();

  useEffect(() => {
    if (!step1Data?.name && !step1Data?.license) {
      fetchUserData(null);
    }
  }, [fetchUserData, step1Data?.name, step1Data?.license]);

  return (
    <>
      <div className="px-4 pt-20">
        <Card className="shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-center">基本資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={() => fetchUserData(null)} 
              className="w-full bg-black text-white hover:bg-gray-800 rounded-xl h-12"
              disabled={isLoading}
            >
              自動填入
            </Button>
            {/* 載入提示 */}
            {isLoading && (
              <Alert className="mb-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  自動填入中，請耐心等候...
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-md font-bold">
                姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder={isLoading ? "正在獲取中…" : "請輸入您的姓名"}
                className="h-12 border-none"
                style={{ backgroundColor: '#f8f8f8' }}
                value={step1Data?.name || ""}
                onChange={(e) => setStep1Data({ name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-md font-bold">
                手機號碼 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder={isLoading ? "正在獲獲中…" : "請輸入您的手機號碼"}
                className="h-12 border-none"
                style={{ backgroundColor: '#f8f8f8' }}
                value={step1Data?.phone || ""}
                onChange={(e) => setStep1Data({ phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license" className="text-md font-bold">
                車牌號碼 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="license"
                name="license"
                autoComplete="off"
                placeholder={isLoading ? "正在獲取中…" : "例如：ABC-1234 或 1234-AA"}
                className="h-12 border-none"
                style={{ backgroundColor: '#f8f8f8' }}
                value={step1Data?.license || ""}
                onChange={(e) =>
                  setStep1Data({ license: e.target.value.toUpperCase() })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup
        isNextDisabled={!step1Data?.name || !step1Data?.phone || !step1Data?.license}
      />
    </>
  );
}

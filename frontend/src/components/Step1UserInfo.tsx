import { Loader2 } from "lucide-react";
import ProgressBar from "./ProgressBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStepStore } from "@/store/step-store";
import StepButtonGroup from "./StepButtonGroup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Step1UserInfo() {
  const step1Data = useStepStore((state) => state.step1Data);
  const setStep1Data = useStepStore((state) => state.setStep1Data);
  const isLoading = useStepStore((state) => state.isLoading);
  const fetchUserData = useStepStore((state) => state.fetchUserData);

  return (
    <div className="min-h-screen bg-background pb-24">
      <ProgressBar />

      <div className="px-4 pt-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">基本資料</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={() => fetchUserData(null)} className="w-full">
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
              <p className="text-md font-bold">
                姓名 <span className="text-destructive">*</span>
              </p>
              <Input
                id="name"
                placeholder={isLoading ? "正在獲取中..." : "請輸入您的姓名"}
                className="h-12"
                value={step1Data?.name || ""}
                onChange={(e) => setStep1Data({ name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <p className="text-md font-bold">
                車牌號碼 <span className="text-destructive">*</span>
              </p>
              <Input
                id="license"
                placeholder={isLoading ? "正在獲取中..." : "請輸入車牌號碼"}
                className="h-12"
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
        isNextDisabled={!step1Data?.name || !step1Data?.license}
      />
    </div>
  );
}

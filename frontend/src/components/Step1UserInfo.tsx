import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStepStore } from "@/store/step-store";
import { useStepUserData } from "@/hooks/useStepUserData";
import { isValidPhone, isValidLicense } from "@/lib/validators";
import StepButtonGroup from "./StepButtonGroup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function Step1UserInfo() {
  const step1Data = useStepStore((state) => state.step1Data);
  const setStep1Data = useStepStore((state) => state.setStep1Data);
  const isLoading = useStepStore((state) => state.isLoading);
  const { fetchUserData } = useStepUserData();

  const phone = step1Data?.phone || "";
  const license = step1Data?.license || "";
  const phoneError = phone !== "" && !isValidPhone(phone);
  const licenseError = license !== "" && !isValidLicense(license);

  return (
    <>
      <div className="px-4 pt-24">
        <Card className="shadow-none border-none gap-4">
          <CardContent className="space-y-6">
            <Button
              onClick={() => fetchUserData()}
              className="w-full h-12"
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
              <Label htmlFor="phone" className="text-md font-bold">
                手機號碼 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder={isLoading ? "正在獲獲中…" : "請輸入您的手機號碼"}
                className={`h-12 ${phoneError ? "ring-2 ring-destructive" : ""}`}
                value={phone}
                onChange={(e) => setStep1Data({ phone: e.target.value })}
              />
              {phoneError && (
                <p className="text-sm text-red-500">手機號碼格式不正確，應為 09 開頭的 10 位數字</p>
              )}
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
                className={`h-12 ${licenseError ? "ring-2 ring-destructive" : ""}`}
                value={license}
                onChange={(e) =>
                  setStep1Data({ license: e.target.value.toUpperCase() })
                }
              />
              {licenseError && (
                <p className="text-sm text-red-500">車牌格式不正確，例如：ABC-1234 或 1234-AA</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <StepButtonGroup
        isNextDisabled={!isValidPhone(phone) || !isValidLicense(license)}
      />
    </>
  );
}

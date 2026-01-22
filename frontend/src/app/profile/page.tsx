"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStepStore } from "@/store/step-store";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Save, X, Loader2, Info, ArrowLeft } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import liff from "@line/liff";
import { auth, user as userApi, FetchError } from "@/lib/api";

interface ProfileFormData {
  pictureUrl?: string;
  name?: string;
  phone?: string;
  license?: string;
}

interface ProfileErrors {
  name?: string;
  phone?: string;
  license?: string;
  form?: string;
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get("new") === "true";

  const [isEditing, setIsEditing] = useState(isNewUser);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, lineId } = useStepStore();
  const setUserId = useStepStore((state) => state.setUserId);
  const step1Data = useStepStore((state) => state.step1Data);
  const setStep1Data = useStepStore((state) => state.setStep1Data);
  const [localData, setLocalData] = useState<ProfileFormData>(step1Data);
  const [showNavigationTip, setShowNavigationTip] = useState(true);
  const [errors, setErrors] = useState<ProfileErrors>({});

  useEffect(() => {
    if (!isEditing) {
      setIsLoading(true);
      setLocalData(step1Data);
      setIsLoading(false);
    }
  }, [step1Data, isEditing]);
  
  useEffect(() => {
    if (isNewUser) {
      setIsEditing(true);
      setLocalData({ pictureUrl: step1Data.pictureUrl });
    }
  }, [isNewUser, step1Data.pictureUrl]);

  const validate = () => {
    const newErrors: ProfileErrors = {};
    if (!localData.name) newErrors.name = "姓名為必填";
    if (!localData.phone) newErrors.phone = "手機號碼為必填";
    if (!localData.license) newErrors.license = "車牌號碼為必填";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setLocalData(step1Data);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (isNewUser) {
      router.push("/profile?new=true");
    }
  };

  const handleGoToBooking = () => {
    router.push("/");
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("無法取得 ID token");
      }

      let updatedProfile;
      if (isNewUser) {
        const created = await auth.login(
          {
            phone: localData.phone,
            license: localData.license,
          },
          idToken
        );

        const createdUser = created.user;
        updatedProfile = await userApi.updateUser(
          createdUser.id,
          {
            name: localData.name || createdUser.name,
            phone: localData.phone,
            license: localData.license,
          },
          idToken
        );

        setUserId(updatedProfile.id);
      } else {
        let targetUserId = userId;
        if (!targetUserId) {
          const resolvedLineId = lineId || (await liff.getProfile()).userId;
          const currentUser = await userApi.getUserByLineId(resolvedLineId, idToken);
          targetUserId = currentUser.id;
          setUserId(targetUserId);
        }

        updatedProfile = await userApi.updateUser(
          targetUserId,
          {
            name: localData.name,
            phone: localData.phone,
            license: localData.license,
          },
          idToken
        );
      }
      setStep1Data({
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        license: updatedProfile.license,
        pictureUrl: updatedProfile.pictureUrl,
      });
      setIsEditing(false);
      setErrors({});
      router.push("/profile");
    } catch (error) {
      console.error("An error occurred while saving the profile:", error);
      if (error instanceof FetchError) {
        setErrors({ form: error.message });
      } else if (error instanceof Error) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "資料儲存失敗" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pb-24">
      <div className="px-4 py-6">
        <div className="flex flex-col items-center mb-6">
          {isLoading ? (
            <>
              <Skeleton className="w-20 h-20 rounded-full mb-3" />
              <Skeleton className="h-6 w-24 mb-1" />
            </>
          ) : (
            <>
              <Avatar className="w-20 h-20 mb-3">
                <AvatarImage src={step1Data?.pictureUrl} alt="User Avatar" />
                <AvatarFallback className="text-lg font-medium"></AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-semibold">{step1Data.name}</h1>
            </>
          )}
        </div>

        {showNavigationTip && !isLoading && (
          <Alert className="mb-6 items-center border-blue-200 bg-blue-50/80 shadow-sm">
            <AlertTitle className="flex items-center text-blue-800 font-medium justify-between">
              <div className="flex gap-3 items-center">
                <Info className="h-4 w-4 text-blue-600" />
                <p>需要預約？</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoToBooking}
                  className="h-9 px-4 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  立即預約
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNavigationTip(false)}
                  className="h-9 w-9 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </AlertTitle>
          </Alert>
        )}

        {isLoading && !isNewUser && (
          <Alert className="mb-6 border-amber-200 bg-amber-50/80 shadow-sm">         
            <AlertTitle className="flex items-center text-amber-800 font-medium gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              正在載入您的基本資料，請耐心等候...
            </AlertTitle>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">基本資料</CardTitle>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                編輯
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isNewUser && (
              <p className="text-sm text-muted-foreground -mt-2 mb-4">
                歡迎！請完成您的基本資料以完成註冊。
              </p>
            )}
            {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}
            <div className="space-y-2">
              <Label htmlFor="profile-name">姓名 <span className="text-destructive">*</span></Label>
              {isEditing ? (
                <>
                  <Input
                    id="profile-name"
                    value={localData?.name || ""}
                    onChange={(e) => setLocalData({ ...localData, name: e.target.value })}
                    className={`h-12 ${errors.name ? 'border-destructive' : ''}`}
                    disabled={isSaving}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </>
              ) : (
                <div className="h-12 px-3 py-2 border rounded-md bg-muted/50 flex items-center">
                  {step1Data?.name || ""}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">手機號碼 <span className="text-destructive">*</span></Label>
              {isEditing ? (
                <>
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={localData?.phone || ""}
                    onChange={(e) => setLocalData({ ...localData, phone: e.target.value })}
                    className={`h-12 ${errors.phone ? 'border-destructive' : ''}`}
                    disabled={isSaving}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </>
              ) : (
                <div className="h-12 px-3 py-2 border rounded-md bg-muted/50 flex items-center">
                  {step1Data?.phone || ""}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-license">車牌號碼 <span className="text-destructive">*</span></Label>
              {isEditing ? (
                <>
                  <Input
                    id="profile-license"
                    value={localData?.license || ""}
                    onChange={(e) => setLocalData({ ...localData, license: e.target.value.toUpperCase() })}
                    className={`h-12 ${errors.license ? 'border-destructive' : ''}`}
                    disabled={isSaving}
                    placeholder="例如：ABC-1234"
                  />
                  {errors.license && <p className="text-sm text-red-500">{errors.license}</p>}
                </>
              ) : (
                <div className="h-12 px-3 py-2 border rounded-md bg-muted/50 flex items-center">
                  {step1Data?.license || ""}
                </div>
              )}
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter>
              <p className="text-xs text-muted-foreground text-center w-full">
                填寫完畢後，請點擊右上角的儲存按鈕。
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}

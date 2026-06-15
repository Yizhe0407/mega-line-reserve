"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStepStore } from "@/store/step-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Save, Loader2 } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import liff from "@line/liff";
import { login } from "@/lib/api/endpoints/auth";
import { AUTH_TOKEN_ERROR_MESSAGE } from "@/constants/errors";
import {
  updateUser,
  getUserByLineId,
} from "@/lib/api/endpoints/user";
import { FetchError } from "@/lib/api/core/fetch-wrapper";

interface ProfileFormData {
  pictureUrl?: string;
  name?: string;
  phone?: string;
  license?: string;
}

interface ProfileErrors {
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
  const setIsNewUser = useStepStore((state) => state.setIsNewUser);
  const step1Data = useStepStore((state) => state.step1Data);
  const setStep1Data = useStepStore((state) => state.setStep1Data);
  const [localData, setLocalData] = useState<ProfileFormData>(step1Data);
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
      setLocalData({ 
        ...step1Data, 
        pictureUrl: step1Data.pictureUrl 
      });
    }
  }, [isNewUser, step1Data]);

  const validate = () => {
    const newErrors: ProfileErrors = {};
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

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error(AUTH_TOKEN_ERROR_MESSAGE);
      }

      let updatedProfile;
      if (isNewUser) {
        const created = await login(
          {
            phone: localData.phone,
            license: localData.license,
          },
          idToken
        );

        const createdUser = created.user;
        updatedProfile = await updateUser(
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
          const currentUser = await getUserByLineId(resolvedLineId, idToken);
          targetUserId = currentUser.id;
          setUserId(targetUserId);
        }

        updatedProfile = await updateUser(
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
      setIsNewUser(false);
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
    <div className="max-w-md mx-auto min-h-screen bg-background pb-32 relative">
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

        {isLoading && !isNewUser && (
          <Alert className="mb-6 border-border bg-muted/50 shadow-sm">
            <AlertTitle className="flex items-center text-foreground font-medium gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              正在載入您的基本資料，請耐心等候...
            </AlertTitle>
          </Alert>
        )}

        <Card className="mb-6 shadow-none border-none gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">基本資料</CardTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                編輯
              </Button>
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
              <Label htmlFor="profile-phone">手機號碼 <span className="text-destructive">*</span></Label>
              {isEditing ? (
                <>
                  <Input
                    id="profile-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={localData?.phone || ""}
                    onChange={(e) => setLocalData({ ...localData, phone: e.target.value })}
                    className={`h-12 ${errors.phone ? 'ring-2 ring-destructive' : ''}`}
                    disabled={isSaving}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </>
              ) : (
                <div className="h-12 px-3 py-2 rounded-xl border border-border bg-card flex items-center">
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
                    name="license"
                    autoComplete="off"
                    value={localData?.license || ""}
                    onChange={(e) => setLocalData({ ...localData, license: e.target.value.toUpperCase() })}
                    className={`h-12 ${errors.license ? 'ring-2 ring-destructive' : ''}`}
                    disabled={isSaving}
                    placeholder="例如：ABC-1234 或 1234-AA"
                  />
                  {errors.license && <p className="text-sm text-red-500">{errors.license}</p>}
                </>
              ) : (
                <div className="h-12 px-3 py-2 rounded-xl border border-border bg-card flex items-center">
                  {step1Data?.license || ""}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Bottom Actions */}
      {isEditing && (
        <div className="absolute bottom-16 left-0 right-0 p-4 bg-background border-t border-border z-20">
          <div className="max-w-md mx-auto flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 h-12 rounded-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  儲存變更
                </>
              )}
            </Button>
          </div>
        </div>
      )}
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

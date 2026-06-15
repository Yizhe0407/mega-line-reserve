import { useCallback } from "react";
import liff from "@line/liff";
import { useSWRConfig } from "swr";
import { useShallow } from "zustand/react/shallow";
import { useStepStore } from "@/store/step-store";
import { useLiffMessage } from "@/hooks/useLiffMessage";
import { createReserve } from "@/lib/api/endpoints/reserve";
import { login } from "@/lib/api/endpoints/auth";
import { updateUser } from "@/lib/api/endpoints/user";
import { FetchError } from "@/lib/api/core/fetch-wrapper";
import { AUTH_TOKEN_ERROR_MESSAGE } from "@/constants/errors";

/**
 * 封裝預約送出流程：同步使用者資料 → 建立預約 → 重新整理快取 → 發送 LINE 訊息。
 *
 * 抽成 Hook 是為了讓 StepButtonGroup 只負責導覽與 UI，業務流程集中於此。
 * 拋出的錯誤訊息可直接呈現給使用者（交由呼叫端以 toast 顯示）。
 */
export function useReservationSubmit() {
  const { mutate } = useSWRConfig();
  const { sendLineMessage } = useLiffMessage();

  const {
    step1Data,
    step2Data,
    step3Data,
    userId,
    isNewUser,
    savedProfile,
    setUserId,
    setIsNewUser,
    setSavedProfile,
  } = useStepStore(
    useShallow((state) => ({
      step1Data: state.step1Data,
      step2Data: state.step2Data,
      step3Data: state.step3Data,
      userId: state.userId,
      isNewUser: state.isNewUser,
      savedProfile: state.savedProfile,
      setUserId: state.setUserId,
      setIsNewUser: state.setIsNewUser,
      setSavedProfile: state.setSavedProfile,
    }))
  );

  // 首次預約：先建立帳號並記住回傳的 userId
  // 既有用戶：僅在 phone/license 與伺服端資料不同時才更新，避免每次預約都多餘寫入
  const syncUserData = useCallback(
    async (idToken: string) => {
      try {
        if (isNewUser) {
          const created = await login(
            { phone: step1Data.phone, license: step1Data.license },
            idToken
          );
          setUserId(created.user.id);
          setIsNewUser(false);
          setSavedProfile({ phone: step1Data.phone, license: step1Data.license });
          return;
        }

        if (!userId) return;

        const isProfileChanged =
          step1Data.phone !== savedProfile?.phone ||
          step1Data.license !== savedProfile?.license;
        if (!isProfileChanged) return;

        await updateUser(
          userId,
          { phone: step1Data.phone, license: step1Data.license },
          idToken
        );
        setSavedProfile({ phone: step1Data.phone, license: step1Data.license });
      } catch (error) {
        const message = error instanceof FetchError ? error.message : "使用者資料儲存失敗";
        throw new Error(message);
      }
    },
    [
      isNewUser,
      userId,
      step1Data.phone,
      step1Data.license,
      savedProfile,
      setUserId,
      setIsNewUser,
      setSavedProfile,
    ]
  );

  const submitReservation = useCallback(async () => {
    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error(AUTH_TOKEN_ERROR_MESSAGE);
    }

    await syncUserData(idToken);

    await createReserve(
      {
        serviceIds: step2Data.selectServe,
        timeSlotId: step3Data.timeSlotId!,
        license: step1Data.license!,
        userMemo: step2Data.isOtherServiceSelected ? step2Data.otherService : undefined,
        date: step3Data.date!,
        isPickup: step2Data.extra,
      },
      idToken
    );

    await mutate((key) => Array.isArray(key) && key[0] === "reserves");
    await sendLineMessage();
  }, [syncUserData, step1Data.license, step2Data, step3Data, mutate, sendLineMessage]);

  return { submitReservation };
}

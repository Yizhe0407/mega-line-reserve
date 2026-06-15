'use client';

import { useCallback } from 'react';
import liff from '@line/liff';
import toast from 'react-hot-toast';
import { login } from '@/lib/api/endpoints/auth';
import { ensureLiffInit } from '@/lib/liff';
import { useStepStore } from '@/store/step-store';
import { FetchError } from '@/lib/api/core/fetch-wrapper';
import { AUTH_TOKEN_ERROR_MESSAGE } from '@/constants/errors';

export function useStepUserData() {
  const setIsLoading = useStepStore((state) => state.setIsLoading);
  const setUserId = useStepStore((state) => state.setUserId);
  const setLineId = useStepStore((state) => state.setLineId);
  const setStep1Data = useStepStore((state) => state.setStep1Data);
  const setIsNewUser = useStepStore((state) => state.setIsNewUser);
  const setSavedProfile = useStepStore((state) => state.setSavedProfile);

  const fetchUserData = useCallback(async () => {
    // 防止重複執行
    if (useStepStore.getState().isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        console.error('LIFF ID is not defined.');
        toast.error('LIFF 設定錯誤');
        return;
      }

      await ensureLiffInit({ withLoginOnExternalBrowser: true });

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const idToken = liff.getIDToken();
      if (!idToken) {
        toast.error(AUTH_TOKEN_ERROR_MESSAGE);
        return;
      }

      // 平行執行：取得 LINE Profile 和 後端登入
      const [lineProfile, response] = await Promise.all([
        liff.getProfile(),
        login({}, idToken)
      ]);

      const lineId = lineProfile.userId;
      setLineId(lineId);
      setUserId(response.user.id);
      setIsNewUser(false);

      setStep1Data({
        pictureUrl: lineProfile.pictureUrl,
        name: response.user.name || '',
        phone: response.user.phone || '',
        license: response.user.license || '',
      });

      // 記錄伺服端原始資料，供送出時判斷是否真有變動
      setSavedProfile({
        phone: response.user.phone || '',
        license: response.user.license || '',
      });
    } catch (error) {
      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null;

      // 處理新用戶錯誤：尚未建立帳號，留在預約流程內讓使用者填寫基本資料，
      // 待第一次預約送出時才一併建立帳號（不再強制跳轉至個人資料頁）
      if (error instanceof FetchError && isRecord(error.data) && error.data.isNewUser) {
        setIsNewUser(true);
        setUserId(null);
        const lineProfile = isRecord(error.data.lineProfile) ? error.data.lineProfile : undefined;
        if (typeof lineProfile?.lineId === 'string') {
          setLineId(lineProfile.lineId);
        }
        setStep1Data({
          pictureUrl: typeof lineProfile?.pictureUrl === 'string' ? lineProfile.pictureUrl : '',
          name: typeof lineProfile?.displayName === 'string' ? lineProfile.displayName : '',
          phone: '',
          license: '',
        });
        return;
      }

      console.error('LIFF/Profile process failed:', error);
      toast.error('初始化或讀取資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setUserId, setLineId, setStep1Data, setIsNewUser, setSavedProfile]);

  return { fetchUserData };
}

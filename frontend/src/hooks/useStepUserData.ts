'use client';

import liff from '@line/liff';
import toast from 'react-hot-toast';
import { login } from '@/lib/api/endpoints/auth';
import { ensureLiffInit } from '@/lib/liff';
import { useStepStore } from '@/store/step-store';

type RouterLike = { push: (url: string) => void } | null | undefined;

export function useStepUserData() {
  const setIsLoading = useStepStore((state) => state.setIsLoading);
  const setUserId = useStepStore((state) => state.setUserId);
  const setLineId = useStepStore((state) => state.setLineId);
  const setStep1Data = useStepStore((state) => state.setStep1Data);

  const fetchUserData = async (router?: RouterLike) => {
    setIsLoading(true);
    try {
      const liffBypass =
        process.env.NEXT_PUBLIC_LIFF_BYPASS === 'true' ||
        process.env.NODE_ENV === 'development';
      if (liffBypass) {
        setUserId(0);
        setLineId('dev-line');
        setStep1Data({
          pictureUrl: '',
          name: 'DEV',
          phone: '',
          license: '',
        });
        toast('已啟用開發模式，略過 LIFF 驗證');
        if (router) {
          router.push('/profile?new=true');
        }
        return;
      }

      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) {
        console.error('LIFF ID is not defined.');
        toast.error('LIFF 設定錯誤');
        return;
      }

      await ensureLiffInit({ withLoginOnExternalBrowser: true });

      if (!liff.isInClient() && !liffBypass) {
        toast.error('此網站僅支援在 LINE 內開啟');
        return;
      }

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const lineProfile = await liff.getProfile();
      const lineId = lineProfile.userId;
      setLineId(lineId);

      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        toast.error('無法取得 access token');
        return;
      }

      const response = await login({}, accessToken);
      setUserId(response.user.id);

      if (!response.user.phone || !response.user.license) {
        setStep1Data({
          pictureUrl: lineProfile.pictureUrl,
          name: response.user.name || '',
          phone: response.user.phone || '',
          license: response.user.license || '',
        });
        if (router) {
          router.push('/profile?new=true');
        }
        return;
      }

      setStep1Data({
        pictureUrl: lineProfile.pictureUrl,
        name: response.user.name || '',
        phone: response.user.phone || '',
        license: response.user.license || '',
      });
    } catch (error) {
      console.error('LIFF/Profile process failed:', error);
      toast.error('初始化或讀取資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchUserData };
}

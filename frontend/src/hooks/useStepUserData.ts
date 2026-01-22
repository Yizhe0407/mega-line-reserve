'use client';

import liff from '@line/liff';
import toast from 'react-hot-toast';
import { login } from '@/lib/api/endpoints/auth';
import { ensureLiffInit } from '@/lib/liff';
import { useStepStore } from '@/store/step-store';
import { FetchError } from '@/lib/api/core/fetch-wrapper';

type RouterLike = { push: (url: string) => void } | null | undefined;

export function useStepUserData() {
  const setIsLoading = useStepStore((state) => state.setIsLoading);
  const setUserId = useStepStore((state) => state.setUserId);
  const setLineId = useStepStore((state) => state.setLineId);
  const setStep1Data = useStepStore((state) => state.setStep1Data);

  const fetchUserData = async (router?: RouterLike) => {
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

      const lineProfile = await liff.getProfile();
      const lineId = lineProfile.userId;
      setLineId(lineId);

      const idToken = liff.getIDToken();
      if (!idToken) {
        toast.error('無法取得 ID token');
        return;
      }

      const response = await login({}, idToken);
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
      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null;

      // 處理新用戶錯誤
      if (error instanceof FetchError && isRecord(error.data) && error.data.isNewUser) {
        const lineProfile = isRecord(error.data.lineProfile) ? error.data.lineProfile : undefined;
        setStep1Data({
          pictureUrl: typeof lineProfile?.pictureUrl === 'string' ? lineProfile.pictureUrl : '',
          name: typeof lineProfile?.displayName === 'string' ? lineProfile.displayName : '',
          phone: '',
          license: '',
        });
        if (router) {
          router.push('/profile?new=true');
        }
        return;
      }
      
      console.error('LIFF/Profile process failed:', error);
      toast.error('初始化或讀取資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchUserData };
}
